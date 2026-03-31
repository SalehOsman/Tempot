# Data Model: Storage Engine

## Entities

### `Attachment`

The sole persistent entity. Represents a stored file with metadata, provider tracking, and soft-delete support.

**Primary Key:** `id` (cuid).
**Storage:** PostgreSQL via Prisma (`packages/database/prisma/schema.prisma`).

| Field          | Type            | Description                                         | Constraints / Validation              |
| -------------- | --------------- | --------------------------------------------------- | ------------------------------------- |
| `id`           | `String` (cuid) | Unique identifier                                   | PK, auto-generated                    |
| `fileName`     | `String`        | UUID v7 storage name (e.g., `{uuidv7}.pdf`)         | Required                              |
| `originalName` | `String`        | User's original filename (sanitized)                | Required, path-traversal stripped     |
| `mimeType`     | `String`        | MIME type (e.g., `application/pdf`)                 | Required, validated against allowlist |
| `size`         | `Int`           | File size in bytes                                  | Required, > 0, <= maxFileSize         |
| `provider`     | `String`        | Storage backend: `local`, `s3`, `drive`, `telegram` | Required                              |
| `providerKey`  | `String`        | Full path/key in provider                           | Required, Unique                      |
| `url`          | `String?`       | Public URL (null for private files)                 | Optional                              |
| `metadata`     | `Json?`         | Extensible JSON (dimensions, duration, etc.)        | Optional                              |
| `moduleId`     | `String?`       | Which module owns this file                         | Optional, Indexed                     |
| `entityId`     | `String?`       | Which entity this file is attached to               | Optional, Indexed                     |
| `isEncrypted`  | `Boolean`       | Whether provider encrypts at rest                   | Default: `false`                      |
| `createdAt`    | `DateTime`      | Creation timestamp                                  | Auto-generated                        |
| `updatedAt`    | `DateTime`      | Last update timestamp                               | Auto-updated                          |
| `createdBy`    | `String?`       | User who uploaded                                   | Optional                              |
| `updatedBy`    | `String?`       | User who last modified                              | Optional                              |
| `isDeleted`    | `Boolean`       | Soft-delete flag                                    | Default: `false`, Indexed             |
| `deletedAt`    | `DateTime?`     | Soft-delete timestamp                               | Optional                              |
| `deletedBy`    | `String?`       | User who deleted                                    | Optional                              |

**Indexes:**

- `@@index([moduleId, entityId])` — query attachments by owning entity
- `@@index([provider])` — provider-specific queries
- `@@index([isDeleted])` — purge job queries

---

### `StorageProvider` (Interface — not persisted)

Contract that all provider implementations must satisfy.

| Property/Method  | Signature                                      | Returns                                       |
| ---------------- | ---------------------------------------------- | --------------------------------------------- |
| `type`           | `readonly StorageProviderType`                 | Provider identifier                           |
| `upload()`       | `(key, data: Buffer \| Readable, contentType)` | `AsyncResult<ProviderUploadResult, AppError>` |
| `download()`     | `(key)`                                        | `AsyncResult<Readable, AppError>`             |
| `delete()`       | `(key)`                                        | `AsyncResult<void, AppError>`                 |
| `getSignedUrl()` | `(key, expiresInSeconds)`                      | `AsyncResult<string, AppError>`               |
| `exists()`       | `(key)`                                        | `AsyncResult<boolean, AppError>`              |

---

### `ProviderUploadResult` (Value Object — ephemeral)

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `providerKey` | `string`  | Storage path/key returned by provider |
| `url`         | `string?` | Public URL if available               |

---

### Provider Configuration Types

| Config Type              | Fields                                                                            | Used By            |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------ |
| `LocalProviderConfig`    | `basePath: string`                                                                | `LocalProvider`    |
| `S3ProviderConfig`       | `bucket`, `region`, `encryptionMode?` (`SSE-S3` \| `SSE-KMS`), `kmsKeyId?`        | `S3Provider`       |
| `DriveProviderConfig`    | `folderId: string`                                                                | `DriveProvider`    |
| `TelegramProviderConfig` | `storageChatId: number \| string`                                                 | `TelegramProvider` |
| `RetentionConfig`        | `days` (default 30), `cronSchedule` (default `'0 3 * * *'`)                       | `processPurge()`   |
| `StorageConfig`          | `provider`, `maxFileSize`, `allowedMimeTypes`, per-provider configs, `retention?` | `StorageService`   |

---

### Event Payloads (not persisted)

| Payload                      | Fields                                                                                                              | Event Name              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `StorageFileUploadedPayload` | `attachmentId`, `fileName`, `originalName`, `mimeType`, `size`, `provider`, `moduleId?`, `entityId?`, `uploadedBy?` | `storage.file.uploaded` |
| `StorageFileDeletedPayload`  | `attachmentId`, `provider`, `providerKey`, `deletedBy?`, `permanent: boolean`                                       | `storage.file.deleted`  |

## Relationships

- `Attachment` has **no foreign key relationships** to other Prisma models.
- Uses **polymorphic association** via `moduleId`/`entityId` — any module can attach files by setting these logical references.
- Event payloads are defined inline in `event-bus.events.ts` (structurally matching the types above) to avoid circular dependencies.

## Storage Mechanisms

### Provider Key Path Structure

```
{moduleId ?? 'general'}/{YYYY-MM}/{uuidv7}.{ext}
```

Example: `cms/2026-03/01948f6a-b3c4-7d2e-9a1b-4c5d6e7f8a9b.pdf`

### Soft Delete + Deferred Purge

1. `StorageService.delete()` → sets `isDeleted = true`, emits event with `permanent: false`
2. `processPurge()` cron job → finds records with `isDeleted = true` AND `deletedAt` older than `retentionDays`
3. Purge deletes from provider, then executes raw SQL `DELETE FROM "Attachment" WHERE id = ANY(...)` (hard delete bypassing soft-delete), emits event with `permanent: true`

### Two-Phase Upload with Rollback

1. Validate → MIME check → generate key → upload to provider → create DB record → emit event
2. If DB insert fails after provider upload: best-effort `provider.delete()` rollback
3. If rollback also fails: log warning with `STORAGE_ERRORS.ROLLBACK_FAILED` (orphan cleaned by purge job)

### Encryption by Provider

| Provider | Encryption                 | `isEncrypted` |
| -------- | -------------------------- | ------------- |
| Local    | None                       | `false`       |
| S3       | SSE-S3 (AES256) or SSE-KMS | `true`        |
| Drive    | Google-managed             | `true`        |
| Telegram | HTTPS + Telegram at-rest   | `true`        |

## Default Configuration

```typescript
DEFAULT_STORAGE_CONFIG = {
  provider: 'local',
  maxFileSize: 10_485_760, // 10 MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
    'text/plain',
  ],
  retention: { days: 30, cronSchedule: '0 3 * * *' },
};
```
