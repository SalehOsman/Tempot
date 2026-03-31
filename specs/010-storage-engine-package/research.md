# Research: Storage Engine

## Decisions

### 1. Provider Architecture

- **Decision:** Strategy pattern — a `StorageProvider` interface with four concrete implementations: `LocalProvider`, `S3Provider`, `DriveProvider`, `TelegramProvider`. A factory function (`createStorageProvider`) creates the appropriate provider from config.
- **Rationale:** Each storage backend has fundamentally different APIs, authentication, and capabilities. The interface enforces a consistent 5-method contract (`upload`, `download`, `delete`, `getSignedUrl`, `exists`) while allowing backend-specific behavior. Drive and Telegram require pre-configured clients, so they have dedicated factory functions (`createDriveProvider`, `createTelegramProvider`).
- **Alternatives considered:** Adapter pattern with abstract base class (rejected — no shared implementation logic across providers). Plugin system (rejected — overkill for 4 known providers).

### 2. File Validation Strategy

- **Decision:** Two-tier validation: synchronous `validateUpload()` for size/MIME/name checks, then async `validateMimeType()` using `file-type` package for magic-byte MIME detection on Buffer data only.
- **Rationale:** Synchronous validation catches obvious issues early. Magic-byte detection prevents MIME spoofing (e.g., uploading an executable disguised as a PDF). Stream data skips magic-byte detection to avoid consuming the stream (violating NFR-005 streaming requirement).
- **Alternatives considered:** mmmagic (rejected — native C++ binding, cross-platform issues). MIME detection on all data including streams (rejected — would require buffering the entire stream, defeating the purpose of streaming uploads).

### 3. File Naming Strategy

- **Decision:** All stored files use UUID v7 names: `{uuidv7}.{ext}`. Original names are preserved only in the `originalName` database field.
- **Rationale:** UUID v7 is time-ordered (sortable) and collision-free, eliminating filename conflicts across concurrent uploads. Stripping original names from storage paths prevents path traversal attacks and encoding issues. The `uuid` package's `v7()` function is used.
- **Alternatives considered:** nanoid (rejected — not time-ordered). Original filename with dedup suffix (rejected — path traversal risk, encoding issues with Arabic filenames).

### 4. Filename Sanitization

- **Decision:** `path.basename()` strips directory traversal, then `replace(/[^a-zA-Z0-9._-]/g, '_')` strips special characters. Empty results after sanitization are rejected.
- **Rationale:** Defense-in-depth — even though UUID v7 names are used for storage, the `originalName` field is still sanitized to prevent XSS when displayed and to normalize Arabic/special characters to underscores.
- **Alternatives considered:** sanitize-filename package (rejected — unnecessary dependency for a simple regex operation).

### 5. Encryption Strategy (D5)

- **Decision:** Delegate encryption to providers. S3 uses SSE-S3 (AES256 default) or SSE-KMS. Drive and Telegram use platform-managed encryption. Local provider has no encryption. The `isEncrypted` flag is set by `StorageService` based on `provider.type`, not by providers themselves.
- **Rationale:** Provider-managed encryption is simpler and more reliable than application-level encryption. SSE-S3 is transparent — no key management required. SSE-KMS adds customer-managed keys for compliance scenarios. The `EncryptionStrategy` interface mentioned in the spec was intentionally deferred — provider-level encryption meets all current requirements.
- **Alternatives considered:** Application-level encryption before upload (rejected — adds complexity, requires key management, prevents server-side operations like virus scanning). No encryption (rejected — Rule XXXVIII requires encryption for sensitive data).

### 6. Dependency Injection via Structural Interfaces

- **Decision:** Define minimal structural interfaces (`StorageLogger`, `StorageEventBus`, `StorageAttachmentRepo`, `StorageValidation`) in `storage.interfaces.ts` instead of importing `@tempot/logger` and `@tempot/event-bus` directly.
- **Rationale:** Prevents circular dependencies in the monorepo dependency graph. The interfaces are structurally compatible (duck-typed) with the actual implementations. At runtime, the real logger and event bus are injected by the consuming application. This also makes unit testing trivial — mock implementations match the minimal interface.
- **Alternatives considered:** Direct imports of `@tempot/logger` and `@tempot/event-bus` (referenced in plan but rejected during implementation — creates circular dependency since event-bus may need to reference storage events). Abstract base class (rejected — TypeScript structural typing makes interfaces sufficient).

### 7. Event Emission Pattern ("Fire-and-Log")

- **Decision:** All event emissions check the `publish()` result; on failure, log a warning with `STORAGE_ERRORS.EVENT_PUBLISH_FAILED` but still return success to the caller.
- **Rationale:** Event bus failures should not break core storage operations. File upload succeeding but event emission failing is recoverable (events can be replayed), while failing the entire upload because of an event bus issue is not acceptable.
- **Alternatives considered:** Fail the operation on event publish failure (rejected — event emission is a side effect, not a core operation). Retry with backoff (rejected — adds complexity, the event bus has its own retry mechanism via BullMQ).

### 8. Soft Delete + Deferred Purge

- **Decision:** `delete()` sets `isDeleted = true` (soft delete via `BaseRepository`). A `processPurge()` function runs as a BullMQ cron job, finding records older than `retentionDays`, deleting from provider, then hard-deleting from DB via raw SQL.
- **Rationale:** Soft delete enables undo functionality and audit trails. Deferred purge batches provider deletions (which may involve API calls) into off-peak hours. Raw SQL `DELETE FROM "Attachment" WHERE id = ANY(...)` bypasses Prisma's soft-delete middleware to achieve true record removal.
- **Alternatives considered:** Immediate hard delete (rejected — no undo, no audit trail). Soft delete without purge (rejected — database grows unboundedly). Prisma's built-in delete (rejected — soft-delete middleware intercepts it).

### 9. Provider Key Path Structure

- **Decision:** `{moduleId ?? 'general'}/{YYYY-MM}/{uuidv7}.{ext}` — organized by module, then by month, with UUID v7 filenames.
- **Rationale:** Module-based partitioning enables per-module access policies (e.g., S3 bucket policies). Monthly partitioning prevents directory explosion and enables time-based lifecycle rules. The `general` fallback handles files without module affiliation.
- **Alternatives considered:** Flat structure (rejected — unmanageable at scale). Per-entity subdirectories (rejected — too many directories, complicates listing). Hash-based sharding (rejected — not human-readable, complicates debugging).

### 10. Two-Phase Upload with Rollback

- **Decision:** Upload to provider first, then create DB record. If DB fails, attempt best-effort `provider.delete()` rollback. If rollback also fails, log with `STORAGE_ERRORS.ROLLBACK_FAILED` and rely on the purge job for eventual cleanup.
- **Rationale:** Provider-first ordering ensures the file exists before the record references it. DB-first would create dangling records pointing to non-existent files. Best-effort rollback handles the common case; the purge job handles edge cases (orphaned files).
- **Alternatives considered:** DB-first then upload (rejected — creates dangling references on upload failure). Transactional outbox pattern (rejected — overkill for file uploads, adds infrastructure complexity).

### 11. S3 Streaming Uploads

- **Decision:** Use `@aws-sdk/lib-storage` `Upload` class instead of `PutObjectCommand` for all uploads (both Buffer and Readable).
- **Rationale:** `Upload` handles multipart uploads transparently, supporting both Buffer and Readable inputs. `PutObjectCommand` requires the entire body in memory, violating NFR-005 streaming requirement for large files. `Upload` also handles automatic retry of failed parts.
- **Alternatives considered:** `PutObjectCommand` for small files + `Upload` for large (rejected — unnecessary complexity, `Upload` handles both cases efficiently).

### 12. Telegram Provider Limitations

- **Decision:** `delete()` is a no-op returning `ok(undefined)`. `getSignedUrl()` returns a temporary Telegram download URL with server-controlled lifetime (~1 hour). `isEncrypted` is always `true`.
- **Rationale:** Telegram Bot API has no file deletion endpoint — files sent to a channel cannot be removed programmatically. Download URLs are generated via `api.getFile()` and are temporary by Telegram's design (expiry not configurable by the bot). All Telegram communication is encrypted in transit (HTTPS) and at rest (server-side).
- **Alternatives considered:** Delete via `deleteMessage()` (rejected — deletes the message but the file remains on Telegram's servers). Permanent URLs (rejected — not supported by Telegram Bot API).

### 13. Result Pattern

- **Decision:** All public methods return `Result<T, AppError>` or `AsyncResult<T, AppError>` via `neverthrow 8.2.0`. 17 error codes defined in `STORAGE_ERRORS` constant.
- **Rationale:** Strict adherence to Rule XXI.
- **Alternatives considered:** None — Rule XXI is non-negotiable.

## Deferred Features

| Feature                        | Status                   | Notes                                                       |
| ------------------------------ | ------------------------ | ----------------------------------------------------------- |
| `VectorIndexer` interface      | Defined, not implemented | Awaits `ai-core` package (D4)                               |
| `EncryptionStrategy` interface | Not implemented          | Provider-level encryption sufficient for now (D5)           |
| Orphan cleanup job             | Out of scope             | Files without DB records cleaned manually or by future task |
