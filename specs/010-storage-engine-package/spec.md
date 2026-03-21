# Feature Specification: Storage Engine (Unified S3/Drive/Local)

**Feature Branch**: `010-storage-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional storage-engine package for unified file management and attachment tracking as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-provider File Upload (Priority: P1)

As a developer, I want to upload files to any storage provider (S3, Google Drive, or Local) using a single interface so that I can change providers without updating my business logic.

**Why this priority**: Fundamental architectural requirement (Rule XVIII) for resource abstraction.

**Independent Test**: Uploading a file and verifying it exists in the active provider's storage (e.g., local folder or S3 bucket).

**Acceptance Scenarios**:

1. **Given** a file stream, **When** I call `StorageEngine.upload()`, **Then** the file is saved to the active provider and a `fileId` is returned.
2. **Given** a file in storage, **When** I request its download link, **Then** the system returns a valid URL or signed link according to the provider's security policy.

---

### User Story 2 - Attachment Metadata Tracking (Priority: P1)

As a developer, I want every uploaded file to be tracked in the database with metadata so that I can easily associate files with users, modules, and entities.

**Why this priority**: Mandatory for data integrity and attachment management (ADR-018).

**Independent Test**: Uploading a file and verifying a corresponding record exists in the `Attachment` table with all base audit fields.

**Acceptance Scenarios**:

1. **Given** a file upload, **When** completed, **Then** a database record is created containing `mimeType`, `size`, `provider`, `url`, and `moduleId`.
2. **Given** a module with `hasAttachments: true`, **When** a user uploads a photo, **Then** the file is automatically processed and indexed for search (optional).

---

## Edge Cases

- **Provider Downtime**: What if S3 is down? (Answer: Implement `Graceful Degradation` or fallback to local storage if configured).
- **Large File Handling**: Preventing memory overflow during large uploads (Answer: Use streams for all upload/download operations; enforce `hono/body-limit`).
- **Orphaned Files**: Files in storage without a DB record (Answer: Implement a cleanup script `pnpm storage:cleanup` to sync DB and storage).

## Clarifications

- **Technical Constraints**: Abstract `StorageProvider` for S3, Google Drive, Local. Hono multipart/body-limit (ADR-022).
- **Constitution Rules**: Rule XVIII (Abstraction Layer) for providers. Rule XXXI (Encryption) for files before upload.
- **Integration Points**: Used by `notifier`, `document-engine`, and `import-engine`. Tracks metadata in `database-package`.
- **Edge Cases**: Provider downtime triggers `Graceful Degradation`. Large file uploads use streams to prevent memory overflow. Orphaned files cleaned via `pnpm storage:cleanup`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an abstract `StorageProvider` interface for S3, Google Drive, and Local.
- **FR-002**: System MUST use Hono's built-in `parseBody()` and `multipart` handling (ADR-022).
- **FR-003**: System MUST automatically track metadata for every file in the `Attachment` table.
- **FR-004**: System MUST enforce file size and type limits per module via `module.config.ts`.
- **FR-005**: System MUST support "Soft Delete" for file metadata; actual file deletion is a background job.
- **FR-006**: System MUST support secure download links (Pre-signed URLs) for private storage.
- **FR-007**: System MUST emit `storage.file.uploaded` and `storage.file.deleted` events.

### Key Entities

- **Attachment**: id, fileName, originalName, mimeType, size, provider, providerKey, url, metadata (JSON), BaseEntity fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: File metadata creation must be atomic with the file upload completion.
- **SC-002**: System successfully handles concurrent uploads up to the server's resource limits.
- **SC-003**: 100% of uploaded files must have corresponding metadata in the DB.
- **SC-004**: System successfully sanitizes all file names to prevent directory traversal or XSS.
