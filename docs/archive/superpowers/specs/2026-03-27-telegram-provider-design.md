# TelegramProvider Design — @tempot/storage-engine

**Date:** 2026-03-27
**Type:** Feature addition to existing package
**Parent spec:** `specs/010-storage-engine-package/spec.md`

## Summary

Add a fourth storage provider (`TelegramProvider`) to `@tempot/storage-engine` that uses Telegram's Bot API as a file storage backend. Files are uploaded as documents to a dedicated private channel via `sendDocument`, and retrieved using `getFile` + download URL.

## Design Decisions (Validated)

### D1: Provider Pattern — Follow DriveProvider

TelegramProvider follows the DriveProvider precedent exactly:

- Receives a pre-configured grammY `Api` instance via constructor (not a `Bot` instance)
- Requires a dedicated `createTelegramProvider()` factory function
- The generic `createStorageProvider()` returns an error for `'telegram'` with guidance to use the dedicated factory

**Validation:** DriveProvider (`drive.provider.ts`) takes `driveClient: drive_v3.Drive` via constructor. Factory (`provider.factory.ts:45-49`) has `createDriveProvider()`. The `'drive'` case in `createStorageProvider()` returns an error directing users to the dedicated factory. TelegramProvider mirrors this exactly.

### D2: Storage Location — Private Channel

Files are uploaded to a private Telegram channel configured via `storageChatId`. The bot must be an admin with "Post Messages" permission.

```typescript
export interface TelegramProviderConfig {
  storageChatId: number | string;
}
```

**Validation:** Matches `DriveProviderConfig { folderId: string }` in simplicity. Single config field.

### D3: File Upload — Always sendDocument

All files are uploaded via `sendDocument` regardless of MIME type. This is the only Telegram method that preserves the original file without modification (no compression, no re-encoding).

### D4: Provider Key — file_id Only

`providerKey = file_id` from `message.document.file_id`. The `key` parameter passed to `upload()` is stored in the document caption for traceability.

**Validation:** Matches `ProviderUploadResult { providerKey: string; url?: string }` at `types.ts:49-52`.

### D5: Delete — No-Op

`delete(key)` returns `ok(undefined)` without contacting Telegram. Telegram has no "delete file" API. Storage is free. No cost incentive to delete.

### D6: Download URL — Ephemeral

`getSignedUrl()` calls `api.getFile(file_id)` and builds the download URL. The `expiresInSeconds` parameter is ignored (same as DriveProvider). Telegram controls URL expiration server-side (~1 hour minimum).

**Validation:** DriveProvider ignores `_expiresInSeconds` at `drive.provider.ts:92`. Same pattern.

### D7: File Size Limit — 20 MB

Telegram allows uploading up to 50 MB but `getFile` (download) is limited to 20 MB. Enforced at config level (`maxFileSize`), not inside the provider.

### D8: grammy as Dependency

`grammy ^1.41.1` added to `packages/storage-engine/package.json` dependencies. Provides `Api` class (for `sendDocument`, `getFile`) and `InputFile` class (wraps `Buffer | Readable`).

## Technical Specification

### Type Changes (types.ts)

```typescript
// Add 'telegram' to union
export type StorageProviderType = 'local' | 's3' | 'drive' | 'telegram';

// New config type
export interface TelegramProviderConfig {
  storageChatId: number | string;
}

// Add to StorageConfig
export interface StorageConfig {
  // ... existing fields ...
  telegram?: TelegramProviderConfig; // NEW
}
```

### TelegramProvider Class (providers/telegram.provider.ts)

- Implements `StorageProvider` interface
- Constructor: `(api: Api, config: TelegramProviderConfig)`
- `upload()`: Uses `InputFile` + `api.sendDocument()`, returns `file_id` as `providerKey`
- `download()`: Uses `api.getFile()` + `fetch()` + `Readable.fromWeb()` for streaming
- `delete()`: No-op, returns `ok(undefined)`
- `getSignedUrl()`: Uses `api.getFile()` + builds download URL, ignores `expiresInSeconds`
- `exists()`: Calls `api.getFile()`, returns `true` on success, `false` on error
- Private helper: `buildDownloadUrl(filePath)` constructs `https://api.telegram.org/file/bot{token}/{filePath}`

### Factory Changes (provider.factory.ts)

- Add `createTelegramProvider(api: Api, config: TelegramProviderConfig): Result<StorageProvider, AppError>`
- Add `'telegram'` case to `createStorageProvider()` switch (returns error directing to dedicated factory)

### Export Changes (index.ts)

- Export `TelegramProviderConfig` type
- Export `TelegramProvider` class
- Export `createTelegramProvider` factory function

### Contracts JSDoc Update (contracts.ts)

Add Telegram behavior documentation to `getSignedUrl` JSDoc.

## Error Handling

All errors use existing `STORAGE_ERRORS` codes:

| Method       | Error Code          | Condition                                       |
| ------------ | ------------------- | ----------------------------------------------- |
| upload       | `UPLOAD_FAILED`     | API failure or missing `file_id`                |
| download     | `DOWNLOAD_FAILED`   | API failure, missing `file_path`, or HTTP error |
| delete       | (none)              | No-op, always succeeds                          |
| getSignedUrl | `SIGNED_URL_FAILED` | API failure or missing `file_path`              |
| exists       | (none)              | Returns `false` on error, never errors          |

## Test Plan

Unit tests only (no integration tests — external API).

Mock strategy follows `drive-provider.test.ts` pattern:

```typescript
function createMockApi(): Api {
  return {
    token: 'test-bot-token',
    sendDocument: vi.fn(),
    getFile: vi.fn(),
  } as unknown as Api;
}
```

15 test cases covering all methods, error paths, and edge cases.

## Files Changed

| File                                   | Action                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `src/types.ts`                         | MODIFY — add `'telegram'`, `TelegramProviderConfig`, `telegram?` field |
| `src/contracts.ts`                     | MODIFY — update `getSignedUrl` JSDoc                                   |
| `src/providers/telegram.provider.ts`   | CREATE — TelegramProvider class                                        |
| `src/provider.factory.ts`              | MODIFY — add factory + switch case                                     |
| `src/index.ts`                         | MODIFY — add exports                                                   |
| `package.json`                         | MODIFY — add `grammy` dependency                                       |
| `tests/unit/telegram-provider.test.ts` | CREATE — unit tests                                                    |

## Out of Scope

- Multi-provider routing
- Proxy endpoint for permanent download URLs
- Local Bot API Server support
- File chunking for >20 MB files
- Changes to ValidationService or StorageService
