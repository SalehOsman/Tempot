# @tempot/storage-engine

> Unified file storage with Google Drive, AWS S3, and local backends. Includes attachment metadata tracking.

## Purpose

Single package for all file operations (merged from v10's separate `attachment-manager` — ADR-018):

- Abstract provider interface — swap storage backends via `STORAGE_PROVIDER` env variable
- `upload()` — stores file + creates metadata record in DB atomically
- `delete()` — removes file + metadata record
- `getUrl()` — generates pre-signed or direct URLs
- `index()` — triggers AI embedding via `@tempot/ai-core` (optional)
- File size limits via `hono/body-limit`

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package | Purpose |
|---------|---------|
| `@googleapis/drive` 8.x | Google Drive provider |
| `@aws-sdk/client-s3` 3.x | S3 provider |
| `@tempot/database` | Attachment metadata tracking |
| `@tempot/ai-core` | Vector indexing (optional) |
| `@tempot/logger` | Upload/delete logging |
| `@tempot/shared` | AppError, Result |

## Providers

| `STORAGE_PROVIDER` | Backend | Auth |
|-------------------|---------|------|
| `local` | Local filesystem `./uploads/` | None |
| `google-drive` | Google Drive API | OAuth2 refresh token |
| `s3` | AWS S3 or compatible (R2, DigitalOcean) | Access key + secret |

## API

```typescript
import { storageEngine } from '@tempot/storage-engine';

// Upload
const result = await storageEngine.upload({
  file: buffer,
  filename: 'invoice-456.pdf',
  mimeType: 'application/pdf',
  uploadedBy: userId,
  moduleId: 'invoices',
  indexForSearch: true,   // triggers ai-core embedding
});
// result: Result<{ url: string; attachmentId: string }, AppError>

// Delete
await storageEngine.delete(attachmentId);

// Get URL
const url = await storageEngine.getUrl(attachmentId); // pre-signed if S3
```

## ADRs

- ADR-018 — Merge attachment-manager into storage-engine
- ADR-022 — Hono built-in multipart over multer

## Status

⏳ **Not yet implemented** — Phase 4
