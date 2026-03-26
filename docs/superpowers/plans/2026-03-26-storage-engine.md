# Storage Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `@tempot/storage-engine` — a unified file management and attachment tracking package supporting Local/S3/Google Drive providers, attachment metadata via Prisma, event emission, and deferred file deletion via BullMQ.

**Architecture:** A `StorageService` orchestrator that coordinates `ValidationService`, `StorageProvider` (interface with 3 implementations), `AttachmentRepository` (extends `BaseRepository<Attachment>`), and `EventBusOrchestrator`. All public APIs return `AsyncResult<T, AppError>` via neverthrow 8.2.0.

**Tech Stack:** TypeScript 5.9.3 (strict), neverthrow 8.2.0, @aws-sdk/client-s3 + lib-storage + s3-request-presigner 3.x, @googleapis/drive 8.x, file-type 19.x, uuid 11.x, vitest 4.1.0.

**Source of Truth:** `specs/010-storage-engine-package/{spec.md, plan.md, tasks.md}`, `docs/superpowers/specs/2026-03-26-storage-engine-design.md`

---

### Task 0: Package Scaffolding (5 min)

**Files:**
- Create: `packages/storage-engine/.gitignore`
- Create: `packages/storage-engine/tsconfig.json`
- Create: `packages/storage-engine/package.json`
- Create: `packages/storage-engine/vitest.config.ts`
- Create: `packages/storage-engine/src/index.ts`
- Create: `packages/storage-engine/tests/unit/` (directory)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/storage-engine/src packages/storage-engine/tests/unit
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
# Compiled output
dist/
src/**/*.js
src/**/*.d.ts
src/**/*.js.map
src/**/*.d.ts.map

# Dependencies
node_modules/

# Generated
*.tsbuildinfo

# Test artifacts
tests/**/*.js
tests/**/*.d.ts
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `package.json`**

```json
{
  "name": "@tempot/storage-engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "neverthrow": "8.2.0",
    "@tempot/shared": "workspace:*",
    "@tempot/database": "workspace:*",
    "@tempot/event-bus": "workspace:*",
    "@tempot/session-manager": "workspace:*",
    "@tempot/logger": "workspace:*",
    "@aws-sdk/client-s3": "3.x",
    "@aws-sdk/s3-request-presigner": "3.x",
    "@aws-sdk/lib-storage": "3.x",
    "@googleapis/drive": "8.x",
    "file-type": "19.x",
    "uuid": "11.x"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
    "@types/uuid": "10.x"
  }
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
    ],
  },
});
```

- [ ] **Step 6: Create empty barrel `src/index.ts`**

```typescript
// Barrel exports — populated in Task 12
```

- [ ] **Step 7: Run `pnpm install` and verify 10-point checklist**

```bash
pnpm install
# Verify: .gitignore, tsconfig outDir=dist, package.json main/types/exports/build/vitest, vitest.config.ts, no console.*, no phantom deps, clean workspace
```

- [ ] **Step 8: Commit**

```bash
git add packages/storage-engine/
git commit -m "chore(storage): scaffold package — 10-point checklist passed"
```

---

### Task 1: Type Definitions, Contracts & Error Codes (10 min)

**Files:**
- Create: `packages/storage-engine/src/types.ts`
- Create: `packages/storage-engine/src/contracts.ts`
- Create: `packages/storage-engine/src/errors.ts`
- Test: `packages/storage-engine/tests/unit/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STORAGE_CONFIG,
  STORAGE_ERRORS,
} from '../../src/index.js';

describe('Types & Contracts', () => {
  describe('DEFAULT_STORAGE_CONFIG', () => {
    it('should have 10MB max file size', () => {
      expect(DEFAULT_STORAGE_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('should have 9 allowed MIME types', () => {
      expect(DEFAULT_STORAGE_CONFIG.allowedMimeTypes).toHaveLength(9);
    });

    it('should default to local provider', () => {
      expect(DEFAULT_STORAGE_CONFIG.provider).toBe('local');
    });

    it('should have 30-day retention', () => {
      expect(DEFAULT_STORAGE_CONFIG.retention?.days).toBe(30);
    });

    it('should have cron schedule for 3 AM daily', () => {
      expect(DEFAULT_STORAGE_CONFIG.retention?.cronSchedule).toBe('0 3 * * *');
    });
  });

  describe('STORAGE_ERRORS', () => {
    it('should have provider error codes', () => {
      expect(STORAGE_ERRORS.PROVIDER_UNAVAILABLE).toBe('storage.provider.unavailable');
      expect(STORAGE_ERRORS.PROVIDER_AUTH_FAILED).toBe('storage.provider.auth_failed');
      expect(STORAGE_ERRORS.PROVIDER_QUOTA_EXCEEDED).toBe('storage.provider.quota_exceeded');
      expect(STORAGE_ERRORS.PROVIDER_UNKNOWN).toBe('storage.provider.unknown');
    });

    it('should have file operation error codes', () => {
      expect(STORAGE_ERRORS.UPLOAD_FAILED).toBe('storage.file.upload_failed');
      expect(STORAGE_ERRORS.DOWNLOAD_FAILED).toBe('storage.file.download_failed');
      expect(STORAGE_ERRORS.DELETE_FAILED).toBe('storage.file.delete_failed');
      expect(STORAGE_ERRORS.NOT_FOUND).toBe('storage.file.not_found');
      expect(STORAGE_ERRORS.SIGNED_URL_FAILED).toBe('storage.file.signed_url_failed');
    });

    it('should have validation error codes', () => {
      expect(STORAGE_ERRORS.FILE_TOO_LARGE).toBe('storage.validation.file_too_large');
      expect(STORAGE_ERRORS.MIME_NOT_ALLOWED).toBe('storage.validation.mime_not_allowed');
      expect(STORAGE_ERRORS.MIME_MISMATCH).toBe('storage.validation.mime_mismatch');
      expect(STORAGE_ERRORS.EMPTY_FILE).toBe('storage.validation.empty_file');
      expect(STORAGE_ERRORS.INVALID_FILENAME).toBe('storage.validation.invalid_filename');
    });

    it('should have rollback error code', () => {
      expect(STORAGE_ERRORS.ROLLBACK_FAILED).toBe('storage.rollback.cleanup_failed');
    });

    it('should have hard delete error code', () => {
      expect(STORAGE_ERRORS.HARD_DELETE_FAILED).toBe('storage.hard_delete_failed');
    });

    it('should have event publish error code', () => {
      expect(STORAGE_ERRORS.EVENT_PUBLISH_FAILED).toBe('storage.event.publish_failed');
    });

    it('should have exactly 17 error codes', () => {
      expect(Object.keys(STORAGE_ERRORS)).toHaveLength(17);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: FAIL (modules not found)

- [ ] **Step 3: Write `src/errors.ts`**

See plan.md Task 1 — Error Codes section. Contains `STORAGE_ERRORS` constant with 17 codes across 5 categories.

- [ ] **Step 4: Write `src/types.ts`**

See plan.md Task 1 — Types section. Contains `StorageProviderType`, `StorageConfig`, `LocalProviderConfig`, `S3ProviderConfig`, `DriveProviderConfig`, `RetentionConfig`, `UploadOptions`, `ProviderUploadResult`, `Attachment`, `DEFAULT_STORAGE_CONFIG`, `VectorIndexer`.

- [ ] **Step 5: Write `src/contracts.ts`**

See plan.md Task 1 — Contracts section. Contains `StorageProvider` interface with 5 methods, `StorageFileUploadedPayload`, `StorageFileDeletedPayload`.

Add `@remarks` JSDoc on `StorageProvider.getSignedUrl()` documenting provider-specific behavior (Design Concern 6).

- [ ] **Step 6: Update `src/index.ts` to export Task 1 symbols**

```typescript
// Types
export type {
  StorageProviderType,
  StorageConfig,
  LocalProviderConfig,
  S3ProviderConfig,
  DriveProviderConfig,
  RetentionConfig,
  UploadOptions,
  ProviderUploadResult,
  Attachment,
  VectorIndexer,
} from './types.js';
export { DEFAULT_STORAGE_CONFIG } from './types.js';

// Contracts
export type { StorageProvider, StorageFileUploadedPayload, StorageFileDeletedPayload } from './contracts.js';

// Errors
export { STORAGE_ERRORS } from './errors.js';
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/storage-engine/src/types.ts packages/storage-engine/src/contracts.ts packages/storage-engine/src/errors.ts packages/storage-engine/src/index.ts packages/storage-engine/tests/unit/types.test.ts
git commit -m "feat(storage): define types, contracts, and error codes (Task 1)"
```

---

### Task 2: File Validation Service (15 min)

**Files:**
- Create: `packages/storage-engine/src/validation.service.ts`
- Test: `packages/storage-engine/tests/unit/validation-service.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ValidationService } from '../../src/validation.service.js';
import { DEFAULT_STORAGE_CONFIG, STORAGE_ERRORS } from '../../src/index.js';
import type { UploadOptions } from '../../src/types.js';

// Mock file-type
vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));

describe('ValidationService', () => {
  const service = new ValidationService(DEFAULT_STORAGE_CONFIG);

  const validOptions: UploadOptions = {
    originalName: 'test-file.pdf',
    mimeType: 'application/pdf',
    size: 1024,
  };

  describe('validateUpload', () => {
    it('should accept a valid upload', () => {
      const result = service.validateUpload(validOptions);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).toBe('test-file.pdf');
        expect(result.value.generatedFileName).toMatch(/^[0-9a-f-]+\.pdf$/);
      }
    });

    it('should reject empty files (size <= 0)', () => {
      const result = service.validateUpload({ ...validOptions, size: 0 });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.EMPTY_FILE);
      }
    });

    it('should reject oversized files', () => {
      const result = service.validateUpload({
        ...validOptions,
        size: DEFAULT_STORAGE_CONFIG.maxFileSize + 1,
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.FILE_TOO_LARGE);
      }
    });

    it('should reject disallowed MIME types', () => {
      const result = service.validateUpload({
        ...validOptions,
        mimeType: 'application/x-executable',
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.MIME_NOT_ALLOWED);
      }
    });

    it('should sanitize path traversal from filename', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: '../../../etc/passwd',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).not.toContain('..');
        expect(result.value.sanitizedName).not.toContain('/');
      }
    });

    it('should strip special characters from filename', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'file (copy) [2].pdf',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).toMatch(/^[a-zA-Z0-9._-]+$/);
      }
    });

    it('should reject filenames that sanitize to empty string', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: '!!!',
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.INVALID_FILENAME);
      }
    });

    it('should generate UUID v7 filename with correct extension', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'photo.jpeg',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.generatedFileName).toMatch(/\.jpeg$/);
      }
    });

    it('should handle files without extension', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'Makefile',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // UUID without extension
        expect(result.value.generatedFileName).toMatch(/^[0-9a-f-]+$/);
      }
    });
  });

  describe('validateMimeType', () => {
    it('should pass when declared MIME matches detected MIME', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'application/pdf',
        ext: 'pdf',
      });

      const buffer = Buffer.from('fake-pdf-content');
      const result = await service.validateMimeType(buffer, 'application/pdf');
      expect(result.isOk()).toBe(true);
    });

    it('should fail when declared MIME does not match detected MIME', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/png',
        ext: 'png',
      });

      const buffer = Buffer.from('fake-png-content');
      const result = await service.validateMimeType(buffer, 'application/pdf');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.MIME_MISMATCH);
      }
    });

    it('should skip check when file-type cannot detect (e.g., text/plain)', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const buffer = Buffer.from('plain text content');
      const result = await service.validateMimeType(buffer, 'text/plain');
      expect(result.isOk()).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: FAIL (ValidationService not found)

- [ ] **Step 3: Write `src/validation.service.ts`**

See plan.md Task 2 — complete implementation. Key points:
- `validateUpload()` is synchronous: empty file check → size check → MIME allowlist → filename sanitization → UUID v7 generation
- `validateMimeType()` is async: uses `fileTypeFromBuffer()` for magic byte detection
- `sanitizeFileName()` strips path traversal via `path.basename()` then special chars via regex
- Add JSDoc on `validateMimeType()` explaining Buffer-only constraint (Design Concern 1)

- [ ] **Step 4: Update barrel exports in `src/index.ts`**

Add:
```typescript
export { ValidationService } from './validation.service.js';
export type { ValidatedFile } from './validation.service.js';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/storage-engine/src/validation.service.ts packages/storage-engine/src/index.ts packages/storage-engine/tests/unit/validation-service.test.ts
git commit -m "feat(storage): implement ValidationService — size, MIME, sanitization, magic bytes (Task 2)"
```

---

### Task 3: LocalProvider (15 min)

**Files:**
- Create: `packages/storage-engine/src/providers/local.provider.ts`
- Test: `packages/storage-engine/tests/unit/local-provider.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { LocalProvider } from '../../src/providers/local.provider.js';
import { STORAGE_ERRORS } from '../../src/errors.js';

describe('LocalProvider', () => {
  let provider: LocalProvider;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    provider = new LocalProvider({ basePath: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('should upload a Buffer and write to disk', async () => {
      const data = Buffer.from('hello world');
      const result = await provider.upload('test/file.txt', data, 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('test/file.txt');
      }
      const content = await readFile(join(tempDir, 'test/file.txt'), 'utf-8');
      expect(content).toBe('hello world');
    });

    it('should upload a Readable stream and write to disk', async () => {
      const data = Readable.from(Buffer.from('stream content'));
      const result = await provider.upload('stream/file.txt', data, 'text/plain');
      expect(result.isOk()).toBe(true);
      const content = await readFile(join(tempDir, 'stream/file.txt'), 'utf-8');
      expect(content).toBe('stream content');
    });
  });

  describe('download', () => {
    it('should return a Readable stream for an existing file', async () => {
      const data = Buffer.from('download me');
      await provider.upload('dl/file.txt', data, 'text/plain');

      const result = await provider.download('dl/file.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chunks: Buffer[] = [];
        for await (const chunk of result.value) {
          chunks.push(Buffer.from(chunk as Buffer));
        }
        expect(Buffer.concat(chunks).toString()).toBe('download me');
      }
    });

    it('should return NOT_FOUND for missing file', async () => {
      const result = await provider.download('nonexistent.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.NOT_FOUND);
      }
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      await provider.upload('del/file.txt', Buffer.from('bye'), 'text/plain');
      const result = await provider.delete('del/file.txt');
      expect(result.isOk()).toBe(true);

      const existsResult = await provider.exists('del/file.txt');
      expect(existsResult.isOk()).toBe(true);
      if (existsResult.isOk()) expect(existsResult.value).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await provider.upload('ex/file.txt', Buffer.from('x'), 'text/plain');
      const result = await provider.exists('ex/file.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return false for missing file (not an error)', async () => {
      const result = await provider.exists('missing.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });

  describe('getSignedUrl', () => {
    it('should return local file path for existing file', async () => {
      await provider.upload('url/file.txt', Buffer.from('x'), 'text/plain');
      const result = await provider.getSignedUrl('url/file.txt', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(join(tempDir, 'url/file.txt'));
      }
    });

    it('should return NOT_FOUND for missing file', async () => {
      const result = await provider.getSignedUrl('missing.txt', 3600);
      expect(result.isErr()).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: FAIL (LocalProvider not found)

- [ ] **Step 3: Write `src/providers/local.provider.ts`**

See plan.md Task 3 — complete implementation. Key points:
- Uses native `node:fs/promises` (writeFile, access, unlink, stat, mkdir) and `node:fs` (createReadStream, createWriteStream)
- Uses `node:stream/promises` pipeline for stream uploads
- All methods return `AsyncResult<T, AppError>`
- `exists()` never errors on missing file — returns `ok(false)`

- [ ] **Step 4: Update barrel exports**

Add:
```typescript
export { LocalProvider } from './providers/local.provider.js';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test --filter @tempot/storage-engine`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/storage-engine/src/providers/ packages/storage-engine/src/index.ts packages/storage-engine/tests/unit/local-provider.test.ts
git commit -m "feat(storage): implement LocalProvider — native fs, no fs-extra (Task 3)"
```

---

### Task 4: S3Provider (15 min)

**Files:**
- Create: `packages/storage-engine/src/providers/s3.provider.ts`
- Test: `packages/storage-engine/tests/unit/s3-provider.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import { S3Provider } from '../../src/providers/s3.provider.js';
import { STORAGE_ERRORS } from '../../src/errors.js';

// Mock AWS SDK modules
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn(() => ({ send: mockSend, __mockSend: mockSend })),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn().mockImplementation(() => ({
    done: vi.fn().mockResolvedValue({}),
  })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.example.com'),
}));

describe('S3Provider', () => {
  const config = { bucket: 'test-bucket', region: 'us-east-1' };
  let provider: S3Provider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new S3Provider(config);
  });

  describe('upload', () => {
    it('should upload with SSE-S3 encryption by default', async () => {
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('key.txt');
      }
    });

    it('should upload with SSE-KMS when configured', async () => {
      const kmsProvider = new S3Provider({
        ...config,
        encryptionMode: 'SSE-KMS',
        kmsKeyId: 'arn:aws:kms:us-east-1:123:key/abc',
      });
      const result = await kmsProvider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isOk()).toBe(true);
    });

    it('should handle stream uploads', async () => {
      const stream = Readable.from(Buffer.from('stream data'));
      const result = await provider.upload('stream.txt', stream, 'text/plain');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('download', () => {
    it('should return error when body is null', async () => {
      // Access the mock send function and configure it
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockClient = new S3Client({ region: 'us-east-1' });
      (mockClient as Record<string, unknown>).__mockSend;
      // This test verifies the NOT_FOUND path when response.Body is null
      // The actual mock behavior should be set up to return null body
    });
  });

  describe('exists', () => {
    it('should return false on error (not an AppError)', async () => {
      // HeadObjectCommand errors should result in ok(false), not err()
      const result = await provider.exists('missing-key');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('getSignedUrl', () => {
    it('should return a pre-signed URL', async () => {
      const result = await provider.getSignedUrl('key.txt', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('https://');
      }
    });
  });
});
```

**Note:** S3Provider tests use mocked AWS SDK. The mocking strategy may need refinement during implementation based on actual AWS SDK mock patterns. The key acceptance criteria are:
- Upload uses `@aws-sdk/lib-storage` `Upload` (not `PutObjectCommand`)
- SSE-S3 (AES256) applied by default, SSE-KMS when configured
- All methods return `AsyncResult<T, AppError>`
- `exists()` returns `ok(false)` on error, never `err()`

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (S3Provider not found)

- [ ] **Step 3: Write `src/providers/s3.provider.ts`**

See plan.md Task 4 — complete implementation.

- [ ] **Step 4: Update barrel exports**

Add:
```typescript
export { S3Provider } from './providers/s3.provider.js';
```

- [ ] **Step 5: Run test to verify it passes**

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(storage): implement S3Provider — streaming upload with SSE (Task 4)"
```

---

### Task 5: DriveProvider (15 min)

**Files:**
- Create: `packages/storage-engine/src/providers/drive.provider.ts`
- Test: `packages/storage-engine/tests/unit/drive-provider.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import { DriveProvider } from '../../src/providers/drive.provider.js';
import { STORAGE_ERRORS } from '../../src/errors.js';
import type { drive_v3 } from '@googleapis/drive';

// Create mock Drive client
function createMockDriveClient(): drive_v3.Drive {
  return {
    files: {
      create: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as drive_v3.Drive;
}

describe('DriveProvider', () => {
  const config = { folderId: 'root-folder-id' };
  let mockDrive: drive_v3.Drive;
  let provider: DriveProvider;

  beforeEach(() => {
    mockDrive = createMockDriveClient();
    provider = new DriveProvider(mockDrive, config);
  });

  describe('upload', () => {
    it('should upload and return file ID and webViewLink', async () => {
      vi.mocked(mockDrive.files.create).mockResolvedValue({
        data: { id: 'drive-file-id', webViewLink: 'https://drive.google.com/file/xxx' },
      });
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('drive-file-id');
        expect(result.value.url).toBe('https://drive.google.com/file/xxx');
      }
    });

    it('should return error when no file ID returned', async () => {
      vi.mocked(mockDrive.files.create).mockResolvedValue({
        data: { id: null },
      });
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
      }
    });
  });

  describe('download', () => {
    it('should return a Readable stream', async () => {
      const mockStream = Readable.from(Buffer.from('drive content'));
      vi.mocked(mockDrive.files.get).mockResolvedValue({ data: mockStream });
      const result = await provider.download('drive-file-id');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a file by ID', async () => {
      vi.mocked(mockDrive.files.delete).mockResolvedValue({});
      const result = await provider.delete('drive-file-id');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('getSignedUrl', () => {
    it('should return webViewLink (expiresInSeconds is ignored)', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: { webViewLink: 'https://drive.google.com/file/xxx' },
      });
      const result = await provider.getSignedUrl('drive-file-id', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('https://drive.google.com/file/xxx');
      }
    });

    it('should return error when no webViewLink available', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: { webViewLink: null },
      });
      const result = await provider.getSignedUrl('drive-file-id', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.SIGNED_URL_FAILED);
      }
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({ data: { id: 'drive-file-id' } });
      const result = await provider.exists('drive-file-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return false on error (not an AppError)', async () => {
      vi.mocked(mockDrive.files.get).mockRejectedValue(new Error('Not found'));
      const result = await provider.exists('missing-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (DriveProvider not found)

- [ ] **Step 3: Write `src/providers/drive.provider.ts`**

See plan.md Task 5. Add `@remarks` JSDoc on `getSignedUrl()` per Design Concern 6.

- [ ] **Step 4: Update barrel exports**

Add:
```typescript
export { DriveProvider } from './providers/drive.provider.js';
```

- [ ] **Step 5: Run test to verify it passes**

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(storage): implement DriveProvider — pre-configured Drive client (Task 5)"
```

---

### Task 6: StorageProviderFactory (5 min)

**Files:**
- Create: `packages/storage-engine/src/provider.factory.ts`
- Test: `packages/storage-engine/tests/unit/provider-factory.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { createStorageProvider, createDriveProvider } from '../../src/provider.factory.js';
import { STORAGE_ERRORS } from '../../src/errors.js';
import type { StorageConfig } from '../../src/types.js';
import type { drive_v3 } from '@googleapis/drive';

describe('StorageProviderFactory', () => {
  describe('createStorageProvider', () => {
    it('should create LocalProvider when configured', () => {
      const config: StorageConfig = {
        provider: 'local',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
        local: { basePath: '/tmp/uploads' },
      };
      const result = createStorageProvider(config);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.type).toBe('local');
    });

    it('should return error when local config missing', () => {
      const config: StorageConfig = {
        provider: 'local',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
      };
      const result = createStorageProvider(config);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.PROVIDER_UNKNOWN);
    });

    it('should create S3Provider when configured', () => {
      const config: StorageConfig = {
        provider: 's3',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
        s3: { bucket: 'my-bucket', region: 'us-east-1' },
      };
      const result = createStorageProvider(config);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.type).toBe('s3');
    });

    it('should return error when S3 config missing', () => {
      const config: StorageConfig = {
        provider: 's3',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
      };
      const result = createStorageProvider(config);
      expect(result.isErr()).toBe(true);
    });

    it('should return error for drive (must use createDriveProvider)', () => {
      const config: StorageConfig = {
        provider: 'drive',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
      };
      const result = createStorageProvider(config);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.PROVIDER_UNKNOWN);
    });

    it('should return error for unknown provider type', () => {
      const config = {
        provider: 'azure' as 'local',
        maxFileSize: 10_000_000,
        allowedMimeTypes: ['text/plain'],
      };
      const result = createStorageProvider(config);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('createDriveProvider', () => {
    it('should create DriveProvider with pre-configured client', () => {
      const mockDrive = { files: {} } as unknown as drive_v3.Drive;
      const result = createDriveProvider(mockDrive, { folderId: 'folder-id' });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.type).toBe('drive');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (factory not found)

- [ ] **Step 3: Write `src/provider.factory.ts`**

See plan.md Task 6 — complete implementation.

- [ ] **Step 4: Update barrel exports**

Add:
```typescript
export { createStorageProvider, createDriveProvider } from './provider.factory.js';
```

- [ ] **Step 5: Run test to verify it passes**

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(storage): implement provider factory — Local/S3/Drive strategy (Task 6)"
```

---

### Task 7: Attachment Prisma Model (5 min)

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Read current schema to find insertion point**

Read `packages/database/prisma/schema.prisma` and identify where to add the `Attachment` model (after the last existing model).

- [ ] **Step 2: Add Attachment model to schema**

```prisma
model Attachment {
  id           String   @id @default(cuid())
  fileName     String
  originalName String
  mimeType     String
  size         Int
  provider     String
  providerKey  String   @unique
  url          String?
  metadata     Json?
  moduleId     String?
  entityId     String?
  isEncrypted  Boolean  @default(false)

  // Audit fields (BaseEntity pattern)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  isDeleted Boolean  @default(false)
  deletedAt DateTime?
  deletedBy String?

  @@index([moduleId, entityId])
  @@index([provider])
  @@index([isDeleted])
}
```

- [ ] **Step 3: Run `prisma format` to validate**

```bash
pnpm --filter @tempot/database exec prisma format
```

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(storage): add Attachment Prisma model with audit fields (Task 7)"
```

---

### Task 8: AttachmentRepository (10 min)

**Files:**
- Create: `packages/storage-engine/src/attachment.repository.ts`
- Test: `packages/storage-engine/tests/unit/attachment-repository.test.ts`

- [ ] **Step 1: Study BaseRepository pattern**

Read `packages/database/src/base/base.repository.ts` to understand:
- Constructor signature: `(auditLogger: IAuditLogger, db?: DatabaseClient)`
- `PrismaModelDelegate` type
- Available inherited methods: `findById`, `findMany`, `create`, `update`, `delete`
- How `protected get model()` works

- [ ] **Step 2: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttachmentRepository } from '../../src/attachment.repository.js';

// Create mock audit logger
function createMockAuditLogger() {
  return {
    log: vi.fn().mockResolvedValue(undefined),
  };
}

// Create mock database client with attachment model
function createMockDb() {
  return {
    attachment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $executeRaw: vi.fn(),
  };
}

describe('AttachmentRepository', () => {
  let repo: AttachmentRepository;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockAuditLogger: ReturnType<typeof createMockAuditLogger>;

  beforeEach(() => {
    mockAuditLogger = createMockAuditLogger();
    mockDb = createMockDb();
    repo = new AttachmentRepository(mockAuditLogger, mockDb as unknown);
  });

  describe('findByModuleAndEntity', () => {
    it('should query by moduleId and entityId', async () => {
      mockDb.attachment.findMany.mockResolvedValue([]);
      const result = await repo.findByModuleAndEntity('chat', 'msg-123');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('findExpiredDeleted', () => {
    it('should query soft-deleted records before date', async () => {
      mockDb.attachment.findMany.mockResolvedValue([]);
      const beforeDate = new Date('2026-01-01');
      const result = await repo.findExpiredDeleted(beforeDate);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('hardDelete', () => {
    it('should execute raw DELETE for permanent removal', async () => {
      mockDb.$executeRaw.mockResolvedValue(3);
      const result = await repo.hardDelete(['id1', 'id2', 'id3']);
      expect(result.isOk()).toBe(true);
      expect(mockDb.$executeRaw).toHaveBeenCalled();
    });

    it('should return HARD_DELETE_FAILED on error', async () => {
      mockDb.$executeRaw.mockRejectedValue(new Error('DB error'));
      const result = await repo.hardDelete(['id1']);
      expect(result.isErr()).toBe(true);
    });
  });
});
```

**Note:** Test mocking strategy will need refinement during implementation based on how BaseRepository's `findMany` interacts with the mock. The key patterns to test: `findByModuleAndEntity` delegates to `findMany`, `findExpiredDeleted` uses date filter, `hardDelete` uses `$executeRaw`.

- [ ] **Step 3: Run test to verify it fails**

Expected: FAIL (AttachmentRepository not found)

- [ ] **Step 4: Write `src/attachment.repository.ts`**

See plan.md Task 8. Key points:
- Extends `BaseRepository<Attachment>` from `@tempot/database`
- `protected moduleName = 'storage'`
- `protected entityName = 'attachment'`
- `protected get model()` returns `(this.db as Record<string, unknown>).attachment as PrismaModelDelegate`
- `hardDelete(ids)` uses `$executeRaw` to bypass soft-delete extension

- [ ] **Step 5: Update barrel exports**

Add:
```typescript
export { AttachmentRepository } from './attachment.repository.js';
```

- [ ] **Step 6: Run test to verify it passes**

Expected: PASS (may need to adjust mock setup based on BaseRepository internals)

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(storage): implement AttachmentRepository — BaseRepository + hardDelete (Task 8)"
```

---

### Task 9: StorageService (Orchestrator) (20 min)

**Files:**
- Create: `packages/storage-engine/src/storage.service.ts`
- Test: `packages/storage-engine/tests/unit/storage-service.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { StorageService } from '../../src/storage.service.js';
import { STORAGE_ERRORS } from '../../src/errors.js';
import type { StorageServiceDeps } from '../../src/storage.service.js';
import type { StorageProvider } from '../../src/contracts.js';
import type { Attachment, UploadOptions } from '../../src/types.js';
import { DEFAULT_STORAGE_CONFIG } from '../../src/types.js';

// --- Mock factories ---

function createMockProvider(type: 'local' | 's3' | 'drive' = 'local'): StorageProvider {
  return {
    type,
    upload: vi.fn().mockResolvedValue(ok({ providerKey: 'general/2026-03/uuid.pdf' })),
    download: vi.fn().mockResolvedValue(ok(null)),  // simplified
    delete: vi.fn().mockResolvedValue(ok(undefined)),
    getSignedUrl: vi.fn().mockResolvedValue(ok('https://signed.url')),
    exists: vi.fn().mockResolvedValue(ok(true)),
  };
}

function createMockAttachmentRepo() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
    findByModuleAndEntity: vi.fn(),
  };
}

function createMockValidation() {
  return {
    validateUpload: vi.fn().mockReturnValue(ok({
      sanitizedName: 'test-file.pdf',
      generatedFileName: '01234567-abcd-7000-8000-000000000001.pdf',
    })),
    validateMimeType: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockEventBus() {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

const mockAttachment: Attachment = {
  id: 'att-123',
  fileName: '01234567-abcd-7000-8000-000000000001.pdf',
  originalName: 'test-file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  provider: 'local',
  providerKey: 'general/2026-03/uuid.pdf',
  url: null,
  metadata: null,
  moduleId: null,
  entityId: null,
  isEncrypted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
};

const validOptions: UploadOptions = {
  originalName: 'test-file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
};

describe('StorageService', () => {
  let service: StorageService;
  let deps: {
    provider: ReturnType<typeof createMockProvider>;
    attachmentRepo: ReturnType<typeof createMockAttachmentRepo>;
    validation: ReturnType<typeof createMockValidation>;
    eventBus: ReturnType<typeof createMockEventBus>;
    logger: ReturnType<typeof createMockLogger>;
    config: typeof DEFAULT_STORAGE_CONFIG;
  };

  beforeEach(() => {
    deps = {
      provider: createMockProvider(),
      attachmentRepo: createMockAttachmentRepo(),
      validation: createMockValidation(),
      eventBus: createMockEventBus(),
      logger: createMockLogger(),
      config: DEFAULT_STORAGE_CONFIG,
    };
    deps.attachmentRepo.create.mockResolvedValue(ok(mockAttachment));
    deps.attachmentRepo.findById.mockResolvedValue(ok(mockAttachment));
    deps.attachmentRepo.delete.mockResolvedValue(ok(undefined));
    deps.attachmentRepo.findByModuleAndEntity.mockResolvedValue(ok([]));

    service = new StorageService(deps as unknown as StorageServiceDeps);
  });

  describe('upload', () => {
    it('should upload successfully and emit event', async () => {
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isOk()).toBe(true);
      expect(deps.provider.upload).toHaveBeenCalled();
      expect(deps.attachmentRepo.create).toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'storage.file.uploaded',
        expect.objectContaining({ attachmentId: 'att-123' }),
      );
    });

    it('should return validation error without uploading', async () => {
      deps.validation.validateUpload.mockReturnValue(
        err(new AppError(STORAGE_ERRORS.EMPTY_FILE)),
      );
      const result = await service.upload(Buffer.from(''), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.upload).not.toHaveBeenCalled();
    });

    it('should return MIME mismatch error for Buffer uploads', async () => {
      deps.validation.validateMimeType.mockResolvedValue(
        err(new AppError(STORAGE_ERRORS.MIME_MISMATCH)),
      );
      const result = await service.upload(Buffer.from('fake'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.upload).not.toHaveBeenCalled();
    });

    it('should return provider error on upload failure', async () => {
      deps.provider.upload.mockResolvedValue(
        err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED)),
      );
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
    });

    it('should rollback provider on DB failure and log', async () => {
      deps.attachmentRepo.create.mockResolvedValue(
        err(new AppError('storage.create_failed')),
      );
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.delete).toHaveBeenCalled();
    });

    it('should log ROLLBACK_FAILED when rollback also fails', async () => {
      deps.attachmentRepo.create.mockResolvedValue(
        err(new AppError('storage.create_failed')),
      );
      deps.provider.delete.mockResolvedValue(
        err(new AppError(STORAGE_ERRORS.DELETE_FAILED)),
      );
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: STORAGE_ERRORS.ROLLBACK_FAILED }),
      );
    });

    it('should NOT log when rollback succeeds', async () => {
      deps.attachmentRepo.create.mockResolvedValue(
        err(new AppError('storage.create_failed')),
      );
      deps.provider.delete.mockResolvedValue(ok(undefined));
      await service.upload(Buffer.from('data'), validOptions);
      expect(deps.logger.warn).not.toHaveBeenCalledWith(
        expect.objectContaining({ code: STORAGE_ERRORS.ROLLBACK_FAILED }),
      );
    });

    it('should log EVENT_PUBLISH_FAILED but still return success', async () => {
      deps.eventBus.publish.mockResolvedValue(
        err(new AppError('event_bus.publish_failed')),
      );
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isOk()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED }),
      );
    });

    it('should set isEncrypted=true for S3 provider', async () => {
      const s3Deps = { ...deps, provider: createMockProvider('s3') };
      s3Deps.attachmentRepo = createMockAttachmentRepo();
      s3Deps.attachmentRepo.create.mockResolvedValue(ok(mockAttachment));
      const s3Service = new StorageService(s3Deps as unknown as StorageServiceDeps);
      await s3Service.upload(Buffer.from('data'), validOptions);
      expect(s3Deps.attachmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isEncrypted: true }),
      );
    });

    it('should generate correct path structure', async () => {
      await service.upload(Buffer.from('data'), {
        ...validOptions,
        moduleId: 'chat',
      });
      // Provider key should match pattern: {moduleId}/{YYYY-MM}/{generatedFileName}
      const uploadCall = deps.provider.upload.mock.calls[0];
      const key = uploadCall[0] as string;
      expect(key).toMatch(/^chat\/\d{4}-\d{2}\//);
    });
  });

  describe('download', () => {
    it('should download by attachment ID', async () => {
      const result = await service.download('att-123');
      expect(deps.attachmentRepo.findById).toHaveBeenCalledWith('att-123');
      expect(deps.provider.download).toHaveBeenCalledWith(mockAttachment.providerKey);
    });

    it('should return error when attachment not found', async () => {
      deps.attachmentRepo.findById.mockResolvedValue(
        err(new AppError('storage.not_found')),
      );
      const result = await service.download('missing-id');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should soft-delete and emit event', async () => {
      const result = await service.delete('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.attachmentRepo.delete).toHaveBeenCalledWith('att-123');
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'storage.file.deleted',
        expect.objectContaining({
          attachmentId: 'att-123',
          permanent: false,
        }),
      );
    });

    it('should log EVENT_PUBLISH_FAILED on delete event failure', async () => {
      deps.eventBus.publish.mockResolvedValue(
        err(new AppError('event_bus.publish_failed')),
      );
      const result = await service.delete('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
          event: 'storage.file.deleted',
        }),
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL for attachment', async () => {
      const result = await service.getSignedUrl('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.provider.getSignedUrl).toHaveBeenCalledWith(
        mockAttachment.providerKey,
        3600,
      );
    });
  });

  describe('findByModuleAndEntity', () => {
    it('should delegate to repository', async () => {
      const result = await service.findByModuleAndEntity('chat', 'msg-123');
      expect(result.isOk()).toBe(true);
      expect(deps.attachmentRepo.findByModuleAndEntity).toHaveBeenCalledWith('chat', 'msg-123');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (StorageService not found)

- [ ] **Step 3: Write `src/storage.service.ts`**

See plan.md Task 9 — complete implementation. Key points:
- `StorageServiceDeps` interface groups 6 dependencies
- Upload flow: validate → MIME check (Buffer only) → generate key → provider upload → DB create → emit event
- Two-phase rollback with logging (Design Concern 3)
- Fire-and-log pattern for events (Design Concern 5)
- `resolveEncryptionStatus()` returns `true` for S3/Drive, `false` for Local
- Add inline comment at `Buffer.isBuffer(data)` explaining NFR-005 rationale (Design Concern 1)

- [ ] **Step 4: Update barrel exports**

Add:
```typescript
export { StorageService } from './storage.service.js';
export type { StorageServiceDeps } from './storage.service.js';
```

- [ ] **Step 5: Run test to verify it passes**

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(storage): implement StorageService — orchestrator with rollback and fire-and-log events (Task 9)"
```

---

### Task 10: Event Registration (5 min)

**Files:**
- Modify: `packages/event-bus/src/events.ts`

- [ ] **Step 1: Read current `events.ts`**

Read `packages/event-bus/src/events.ts` to see existing `TempotEvents` interface.

- [ ] **Step 2: Add storage events with inline payload types**

Update `TempotEvents` to add:
- `'storage.file.uploaded'` with inline payload matching `StorageFileUploadedPayload`
- `'storage.file.deleted'` with inline payload matching `StorageFileDeletedPayload`

Payload types MUST be defined inline — NOT imported from `@tempot/storage-engine` (avoids circular dependency).

See plan.md Task 10 for exact code.

- [ ] **Step 3: Verify TypeScript compilation**

```bash
pnpm --filter @tempot/event-bus build
```

- [ ] **Step 4: Commit**

```bash
git add packages/event-bus/src/events.ts
git commit -m "feat(storage): register storage events in TempotEvents interface (Task 10)"
```

---

### Task 11: Deferred Deletion Job (Purge) (10 min)

**Files:**
- Create: `packages/storage-engine/src/jobs/purge.job.ts`
- Test: `packages/storage-engine/tests/unit/purge-job.test.ts`

- [ ] **Step 1: Study queueFactory pattern**

Read `packages/shared/src/queue/queue.factory.ts` to understand the API: `queueFactory(name, options?)` returns `Result<Queue, AppError>`.

- [ ] **Step 2: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { STORAGE_ERRORS } from '../../src/errors.js';

// Test the purge logic functions independently from BullMQ Worker
// The actual Worker instantiation requires a Redis connection,
// so we test the processing logic as exported functions

describe('PurgeJob', () => {
  // Tests verify the purge processing logic:
  // 1. Queries expired deleted records
  // 2. Deletes from provider
  // 3. Hard-deletes from DB
  // 4. Emits storage.file.deleted with permanent: true
  // 5. Handles provider delete failures gracefully

  it('should purge expired records and emit events', async () => {
    // This test verifies the complete purge flow
  });

  it('should handle no expired records gracefully', async () => {
    // Empty result from findExpiredDeleted
  });

  it('should continue processing when provider delete fails for one record', async () => {
    // Provider.delete fails for one record but continues with others
  });

  it('should emit storage.file.deleted with permanent: true', async () => {
    // Verify event payload has permanent: true
  });

  it('should use queueFactory to create the queue', async () => {
    // Verify queueFactory('storage-purge') is called
  });
});
```

**Note:** The purge job test strategy will be refined during implementation. Key concern: BullMQ Worker requires a Redis connection. The recommended approach is to extract the processing logic into a testable function and mock the queue/worker setup.

- [ ] **Step 3: Run test to verify it fails**

Expected: FAIL (purge job module not found)

- [ ] **Step 4: Write `src/jobs/purge.job.ts`**

Key points:
- Uses `queueFactory('storage-purge')` from `@tempot/shared`
- Processing logic: `findExpiredDeleted(beforeDate)` → for each record: `provider.delete(providerKey)` → `attachmentRepo.hardDelete([id])` → emit `storage.file.deleted` with `permanent: true`
- Handles provider failures gracefully (log and continue)
- Uses `@tempot/logger` — no `console.*`
- Configurable retention via `RetentionConfig.days`

- [ ] **Step 5: Run test to verify it passes**

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(storage): implement purge job — deferred deletion via BullMQ (Task 11)"
```

---

### Task 12: Barrel Exports (`src/index.ts`) (5 min)

**Files:**
- Update: `packages/storage-engine/src/index.ts`

- [ ] **Step 1: Write complete barrel exports**

```typescript
// Types
export type {
  StorageProviderType,
  StorageConfig,
  LocalProviderConfig,
  S3ProviderConfig,
  DriveProviderConfig,
  RetentionConfig,
  UploadOptions,
  ProviderUploadResult,
  Attachment,
  VectorIndexer,
} from './types.js';
export { DEFAULT_STORAGE_CONFIG } from './types.js';

// Contracts
export type { StorageProvider, StorageFileUploadedPayload, StorageFileDeletedPayload } from './contracts.js';

// Errors
export { STORAGE_ERRORS } from './errors.js';

// Validation
export { ValidationService } from './validation.service.js';
export type { ValidatedFile } from './validation.service.js';

// Providers
export { LocalProvider } from './providers/local.provider.js';
export { S3Provider } from './providers/s3.provider.js';
export { DriveProvider } from './providers/drive.provider.js';

// Factory
export { createStorageProvider, createDriveProvider } from './provider.factory.js';

// Repository
export { AttachmentRepository } from './attachment.repository.js';

// Service
export { StorageService } from './storage.service.js';
export type { StorageServiceDeps } from './storage.service.js';
```

- [ ] **Step 2: Run all tests to verify nothing broke**

```bash
pnpm test --filter @tempot/storage-engine
```

Expected: ALL PASS

- [ ] **Step 3: Final 10-point checklist verification**

```bash
# 1. .gitignore exists
# 2. tsconfig outDir=dist
# 3-5. package.json: main/types/exports/build/vitest
# 6. vitest.config.ts exists
# 7. vitest version 4.1.0 exact
# 8. No console.* in src/
# 9. No phantom dependencies
# 10. No compiled artifacts in src/
```

- [ ] **Step 4: Commit**

```bash
git add packages/storage-engine/src/index.ts
git commit -m "feat(storage): add barrel exports and verify package checklist (Task 12)"
```

---

## Execution Order Summary

| Order | Task | Est. Time | Dependencies |
|-------|------|-----------|-------------|
| 1 | Task 0: Scaffolding | 5 min | None |
| 2 | Task 1: Types/Contracts/Errors | 10 min | Task 0 |
| 3 | Task 7: Prisma Model | 5 min | Task 0 |
| 4 | Task 2: ValidationService | 15 min | Task 1 |
| 5 | Task 3: LocalProvider | 15 min | Task 1 |
| 6 | Task 4: S3Provider | 15 min | Task 1 |
| 7 | Task 5: DriveProvider | 15 min | Task 1 |
| 8 | Task 6: ProviderFactory | 5 min | Tasks 3-5 |
| 9 | Task 8: AttachmentRepository | 10 min | Tasks 1, 7 |
| 10 | Task 10: Event Registration | 5 min | Task 1 |
| 11 | Task 9: StorageService | 20 min | Tasks 2, 6, 8 |
| 12 | Task 11: Purge Job | 10 min | Tasks 6, 8 |
| 13 | Task 12: Barrel Exports | 5 min | All |
| **Total** | | **140 min** | |

## Critical Rules to Follow

1. **TDD mandatory**: RED test first → GREEN implementation → REFACTOR → commit
2. **All public APIs**: `Result<T, AppError>` or `AsyncResult<T, AppError>` via neverthrow 8.2.0
3. **No `any` types**: No eslint-disable, no @ts-ignore
4. **No `console.*`**: Use `@tempot/logger` (Pino)
5. **No `fs-extra`**: Use native `node:fs/promises` and `node:fs` streams
6. **`.js` extensions**: All relative imports for ESM/NodeNext compliance
7. **Repository pattern**: No direct Prisma calls in services (Rule XIV)
8. **Event naming**: `{module}.{entity}.{action}` format
9. **Fire-and-log**: Check event publish result, log warning on failure, still return success
10. **Clean diff**: Only touch files in `packages/storage-engine/`, `packages/database/prisma/schema.prisma`, and `packages/event-bus/src/events.ts`
