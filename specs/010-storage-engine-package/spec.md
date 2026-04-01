# Feature Specification: Storage Engine (Unified S3/Drive/Telegram/Local)

**Feature Branch**: `010-storage-engine-package`
**Created**: 2026-03-19
**Clarified**: 2026-03-26
**Status**: Complete
**Input**: User description: "Establish the functional storage-engine package for unified file management and attachment tracking as per Tempot v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Multi-provider File Upload (Priority: P1)

As a developer, I want to upload files to any storage provider (S3, Google Drive, Telegram, or Local) using a single interface so that I can change providers without updating my business logic.

**Why this priority**: Fundamental architectural requirement (Rule XVIII) for resource abstraction.

**Independent Test**: Uploading a file and verifying it exists in the active provider's storage (e.g., local folder or S3 bucket).

**Acceptance Scenarios**:

1. **Given** a `Buffer` or `Readable` stream with upload options, **When** I call `StorageService.upload()`, **Then** the file is saved to the active provider, an `Attachment` record is created in the database, and a `Result<Attachment, AppError>` is returned.
2. **Given** a file in storage, **When** I request its download via `StorageService.download(attachmentId)`, **Then** the system returns `Result<Readable, AppError>` containing the file stream.
3. **Given** a private file, **When** I call `StorageService.getSignedUrl(attachmentId)`, **Then** the system returns `Result<string, AppError>` with a time-limited signed URL (S3/Drive) or a local file path (LocalProvider).

---

### User Story 2 - Attachment Metadata Tracking (Priority: P1)

As a developer, I want every uploaded file to be tracked in the database with metadata so that I can easily associate files with users, modules, and entities.

**Why this priority**: Mandatory for data integrity and attachment management (ADR-018).

**Independent Test**: Uploading a file and verifying a corresponding record exists in the `Attachment` table with all base audit fields.

**Acceptance Scenarios**:

1. **Given** a file upload, **When** completed, **Then** a database record is created containing `fileName`, `originalName`, `mimeType`, `size`, `provider`, `providerKey`, `moduleId`, and all audit fields.
2. **Given** a file that is soft-deleted, **When** the retention period expires (default 30 days), **Then** a background job permanently deletes the file from the provider and removes the DB record.

---

## Edge Cases

- **Provider Downtime**: If S3/Google Drive is unreachable during upload, the provider method returns `err(AppError('storage.provider.unavailable'))`. The caller decides whether to retry or fallback. storage-engine does NOT implement automatic provider fallback — this is a deployment decision.
- **Large File Handling**: All upload/download operations use streams. `hono/body-limit` is enforced by the API/bot layer (ADR-022), not by storage-engine. storage-engine validates file size against configured limits before uploading.
- **Orphaned Files**: Files in storage without a DB record. Caused by D3 two-phase upload where DB insert fails and cleanup also fails. A scheduled BullMQ job (`storage.orphan.cleanup`) scans for files without matching DB records. Exposed via `pnpm storage:cleanup` for manual runs.
  > **[DEFERRED]**: Orphan cleanup job is deferred to a follow-up task. The soft-delete purge cycle (processPurge) is implemented; orphan detection requires additional cross-referencing logic.
- **Concurrent Upload of Same Filename**: UUID v7 naming (D2) prevents collisions entirely. Two users uploading `photo.jpg` at the same time produce different `providerKey` values.
- **MIME Type Spoofing**: Validate MIME type via magic bytes (file signature) using the `file-type` package, not just the file extension. If the detected MIME does not match the declared MIME, reject with `AppError('storage.validation.mime_mismatch')`.
- **Upload Succeeds but DB Insert Fails**: D3 two-phase rollback. Best-effort file deletion from provider. If cleanup fails, file is orphaned and cleaned by the scheduled job.
- **Provider Key Does Not Exist on Download**: Provider returns an error, wrapped in `AppError('storage.file.not_found')`.
- **Storage Quota Exceeded**: Provider returns quota error, wrapped in `AppError('storage.provider.quota_exceeded')`. Do NOT retry — caller must handle capacity planning.
- **Invalid/Malicious File Content**: File size validated against limits before upload starts. Zero-byte files rejected with `AppError('storage.validation.empty_file')`.
- **Provider Credential Expiry Mid-Operation**: Provider errors wrapped in `AppError('storage.provider.auth_failed')`. Caller is responsible for credential refresh/re-auth.
- **Static Mode Override**: When `REGIONAL_MODE=static`, storage-engine behavior does not change — it is region-agnostic.

## Design Decisions & Clarifications

### D1. Provider Strategy Pattern

Runtime-switchable providers via `StorageProviderFactory`. The active provider is selected by the `STORAGE_PROVIDER` environment variable (`local` | `s3` | `drive` | `telegram`). Consumers call `StorageService`, never providers directly. This satisfies Rule XVIII (Abstraction Layer).

### D2. UUID v7 File Naming

The `providerKey` uses UUID v7 (time-ordered, collision-free). Path structure: `{moduleId}/{YYYY-MM}/{uuidv7}.{ext}`. The user's original filename is stored in the `originalName` field only — it is never used as a file path. This prevents directory traversal, filename collision, and XSS via filenames.

### D3. Two-Phase Upload with Best-Effort Rollback

Upload is a two-phase operation:

1. Upload file to provider (get `providerKey`)
2. Create `Attachment` DB record

If DB insert fails (phase 2), attempt to delete the uploaded file from the provider (best-effort). If cleanup also fails, the file becomes orphaned and is cleaned by the scheduled orphan cleanup job. This approach guarantees SC-001 (atomicity) as closely as possible without distributed transactions.

### D4. Deferred ai-core Integration

A `VectorIndexer` interface is defined in contracts but NOT implemented. The `ai-core` package will implement this interface when built. `StorageService` accepts an optional `VectorIndexer` dependency. The FR that mentions "indexed for search" is **[DEFERRED: depends on ai-core]**.

### D5. Provider-Level Encryption

- **S3**: Uses SSE-S3 by default (configurable to SSE-KMS via `S3_ENCRYPTION_MODE` env var).
- **Google Drive**: Files are encrypted by Google by default — no additional configuration needed.
- **Local**: Stores `isEncrypted: false`. No encryption is applied.
- An `EncryptionStrategy` interface is defined for future application-level encryption (deferred to when ai-core introduces sensitive data).
- **Telegram**: Files are encrypted in transit (HTTPS) and at rest by Telegram servers. No additional configuration needed. Delete is a no-op (Telegram has no file deletion API). `isEncrypted` is set to `true` for Telegram provider uploads.
  > **Security Note**: Telegram Bot API requires the bot token in file download URLs (`api.telegram.org/file/bot{token}/{path}`). The `getSignedUrl()` method returns these token-bearing URLs. Callers MUST NOT log, persist, or expose these URLs to end users. The `buildDownloadUrl` method is private to enforce this boundary.

File name sanitization: `path.basename()` + strip special characters via regex `/[^a-zA-Z0-9._-]/g`.

### D6. Soft Delete with Deferred Purge

`StorageService.delete()` sets `isDeleted=true` on the Attachment record, emits `storage.file.deleted` (with `permanent: false`). A BullMQ scheduled job processes `isDeleted` records older than a configurable retention period (default 30 days) and permanently deletes the actual files from the provider, then removes the DB records, emitting `storage.file.deleted` (with `permanent: true`). The purge queue is created via `queueFactory` and accepts an optional `ShutdownManager` for graceful shutdown (Rule XVII).

### Package Boundary with Hono (ADR-022)

storage-engine is a **library** — it does NOT handle HTTP or multipart. Hono's `parseBody()` is used by the API/bot layer, which then passes `Buffer | Readable` to `StorageService.upload()`. FR-002 scope: "The API/bot layer MUST use Hono's built-in `parseBody()` and `hono/body-limit` (ADR-022) for multipart handling. storage-engine receives parsed file data as `Buffer | Readable`."

### Cross-Package Modification

The `Attachment` Prisma model is added to `packages/database/prisma/schema.prisma`. This is acceptable — the `database` package owns the schema, `storage-engine` owns the repository and service logic. Storage events are registered in `packages/event-bus/src/event-bus.events.ts` in the `TempotEvents` interface.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an abstract `StorageProvider` interface with methods: `upload(key, data, options)`, `download(key)`, `delete(key)`, `getSignedUrl(key, expiresIn)`. Each returns `AsyncResult<T, AppError>`.
- **FR-002**: storage-engine receives parsed file data as `Buffer | Readable` from the API/bot layer. It does NOT handle HTTP multipart directly. The API/bot layer MUST use Hono's built-in `parseBody()` and `hono/body-limit` (ADR-022).
- **FR-003**: System MUST automatically create an `Attachment` database record for every uploaded file, tracking `fileName`, `originalName`, `mimeType`, `size`, `provider`, `providerKey`, `url`, `metadata`, `moduleId`, `entityId`, and all BaseEntity audit fields.
- **FR-004**: System MUST enforce file size and type limits per module via `StorageConfig`. Default max file size: 10MB. Default allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain`, `text/csv`, `application/json`. Modules override defaults via their own config.
- **FR-005**: System MUST support soft delete for file metadata (`isDeleted=true`). Actual file deletion from the provider is a deferred background job via BullMQ (D6).
- **FR-006**: System MUST support secure download links via `getSignedUrl()`. S3 returns pre-signed URLs. Google Drive returns shareable links. Telegram returns ephemeral download URLs (~1 hour, server-controlled). LocalProvider returns the local file path.
- **FR-007**: System MUST emit `storage.file.uploaded` and `storage.file.deleted` events via event-bus with typed payloads.
- **FR-008**: System MUST support a `TEMPOT_STORAGE_ENGINE` environment variable (`true`/`false`, default `true`) to enable/disable the storage-engine package per Constitution Rule XVI (Pluggable Architecture). When disabled, all `StorageService` methods return `err(AppError)` with error code `storage.disabled`, and no provider is initialized.

### Key Entities

#### Attachment (Prisma Model)

Added to `packages/database/prisma/schema.prisma`:

```prisma
model Attachment {
  id           String   @id @default(cuid())
  fileName     String   // UUID v7 based name used in storage
  originalName String   // User's original filename (sanitized)
  mimeType     String
  size         Int
  provider     String   // 'local' | 's3' | 'drive' | 'telegram'
  providerKey  String   @unique // Full path/key in provider
  url          String?  // Public URL (null for private files)
  metadata     Json?    // Extensible metadata (dimensions, duration, etc.)
  moduleId     String?  // Which module owns this file
  entityId     String?  // Which entity this file is attached to
  isEncrypted  Boolean  @default(false)

  // Audit fields (BaseEntity pattern)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
> **Implementation Note**: The createdBy/updatedBy population mechanism depends on the session context integration. The fields are defined in the data model but their population requires the caller to provide userId through UploadOptions (not yet implemented).
  isDeleted Boolean  @default(false)
  deletedAt DateTime?
  deletedBy String?

  @@index([moduleId, entityId])
  @@index([provider])
  @@index([isDeleted])
}
```

### Event Payloads

```typescript
// Registered in packages/event-bus/src/event-bus.events.ts TempotEvents interface

// storage.file.uploaded
interface StorageFileUploadedPayload {
  attachmentId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  provider: string;
  moduleId?: string;
  entityId?: string;
  uploadedBy?: string;
}

// storage.file.deleted
interface StorageFileDeletedPayload {
  attachmentId: string;
  provider: string;
  providerKey: string;
  deletedBy?: string;
  permanent: boolean; // false = soft delete, true = permanent purge
}
```

---

## Non-Functional Requirements

- **NFR-001**: Upload latency < 500ms for files under 1MB (excluding network time to external provider).
- **NFR-002**: Support at least 10 concurrent uploads per instance without degradation.
- **NFR-003**: Default max file size: 10MB. Configurable per module up to 100MB.
- **NFR-004**: Provider switch requires ZERO code changes in consuming modules — configuration only.
- **NFR-005**: All file operations use streams — never load entire file into memory (except for small files under 1MB where buffering is acceptable for S3 `PutObjectCommand`).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: File metadata creation must be atomic with the file upload completion (D3 two-phase upload).
- **SC-002**: System successfully handles concurrent uploads up to 10 per instance (NFR-002).
- **SC-003**: 100% of uploaded files must have corresponding metadata in the DB.
- **SC-004**: System successfully sanitizes all file names to prevent directory traversal or XSS (D2 UUID v7 naming + `originalName` sanitization).
