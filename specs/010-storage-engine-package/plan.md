# Implementation Plan: Storage Engine (010)

**Spec**: `specs/010-storage-engine-package/spec.md` (Clarified)
**Created**: 2026-03-26
**Dependencies**: `@tempot/shared`, `@tempot/database`, `@tempot/event-bus`, `@tempot/session-manager`, `@tempot/logger`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   StorageService                     │
│  (orchestrator: upload, download, delete, getUrl)   │
│  Returns AsyncResult<T, AppError> for all methods   │
├──────────┬──────────────┬───────────┬───────────────┤
│          │              │           │               │
│  AttachmentRepo   ProviderFactory  EventBus  Logger │
│  (BaseRepo<T>)   (creates driver)                   │
├──────────┴──────┬───────┴───────────┴───────────────┤
│                 │                                    │
│         StorageProvider (interface)                              │
│    ┌────────────┼────────────┬──────────────┐                   │
│    │            │            │              │                   │
│  Local       S3Provider  DriveProvider  TelegramProvider        │
│  Provider    (@aws-sdk)  (@googleapis)  (grammy)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task 0 — Package Scaffolding

### Files Created

- `packages/storage-engine/package.json`
- `packages/storage-engine/tsconfig.json`
- `packages/storage-engine/.gitignore`
- `packages/storage-engine/vitest.config.ts`
- `packages/storage-engine/src/index.ts` (empty barrel)

### package.json

```jsonc
{
  "name": "@tempot/storage-engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
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
    "uuid": "11.x",
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
    "@types/uuid": "10.x",
  },
}
```

### 10-Point Checklist

All items from `docs/developer/package-creation-checklist.md` must pass before first code commit.

---

## Task 1 — Type Definitions & Contracts

### FR Covered: FR-001, FR-004, FR-007

### Files

- `src/types.ts` — Core type definitions
- `src/contracts.ts` — Provider interface and event payloads
- `src/errors.ts` — Error code constants

### Types (`src/types.ts`)

```typescript
import type { Readable } from 'node:stream';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Storage provider identifier */
export type StorageProviderType = 'local' | 's3' | 'drive' | 'telegram';

/** Configuration for storage engine */
export interface StorageConfig {
  provider: StorageProviderType;
  maxFileSize: number; // bytes, default 10MB
  allowedMimeTypes: string[];
  local?: LocalProviderConfig;
  s3?: S3ProviderConfig;
  drive?: DriveProviderConfig;
  telegram?: TelegramProviderConfig;
  retention?: RetentionConfig;
}

export interface LocalProviderConfig {
  basePath: string; // e.g., './uploads'
}

export interface S3ProviderConfig {
  bucket: string;
  region: string;
  encryptionMode?: 'SSE-S3' | 'SSE-KMS';
  kmsKeyId?: string;
}

export interface DriveProviderConfig {
  folderId: string; // Root folder ID in Google Drive
}

export interface TelegramProviderConfig {
  storageChatId: number | string;
}

export interface RetentionConfig {
  days: number; // Default 30
  cronSchedule: string; // Default '0 3 * * *' (3 AM daily)
}

/** Options for uploading a file */
export interface UploadOptions {
  originalName: string;
  mimeType: string;
  size: number;
  moduleId?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Result of a provider upload operation */
export interface ProviderUploadResult {
  providerKey: string;
  url?: string;
}

/** Attachment entity matching the Prisma model */
export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  provider: string;
  providerKey: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
  moduleId: string | null;
  entityId: string | null;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}

/** Default configuration values (FR-004, NFR-003) */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  provider: 'local',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  retention: {
    days: 30,
    cronSchedule: '0 3 * * *',
  },
};

/** Deferred: VectorIndexer interface for ai-core integration (D4) */
export interface VectorIndexer {
  index(attachmentId: string, content: Buffer): AsyncResult<void, AppError>;
}
```

### Contracts (`src/contracts.ts`)

```typescript
import type { Readable } from 'node:stream';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { StorageProviderType, ProviderUploadResult } from './types.js';

/** Abstract storage provider interface (FR-001) */
export interface StorageProvider {
  readonly type: StorageProviderType;
  upload(
    key: string,
    data: Buffer | Readable,
    contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError>;
  download(key: string): AsyncResult<Readable, AppError>;
  delete(key: string): AsyncResult<void, AppError>;
  getSignedUrl(key: string, expiresInSeconds: number): AsyncResult<string, AppError>;
  exists(key: string): AsyncResult<boolean, AppError>;
}

/** Event payload: storage.file.uploaded (FR-007) */
export interface StorageFileUploadedPayload {
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

/** Event payload: storage.file.deleted (FR-007) */
export interface StorageFileDeletedPayload {
  attachmentId: string;
  provider: string;
  providerKey: string;
  deletedBy?: string;
  permanent: boolean;
}
```

### Error Codes (`src/errors.ts`)

```typescript
/** Hierarchical error codes for storage module (Rule XXII) */
export const STORAGE_ERRORS = {
  // Provider errors
  PROVIDER_UNAVAILABLE: 'storage.provider.unavailable',
  PROVIDER_AUTH_FAILED: 'storage.provider.auth_failed',
  PROVIDER_QUOTA_EXCEEDED: 'storage.provider.quota_exceeded',
  PROVIDER_UNKNOWN: 'storage.provider.unknown',

  // File operation errors
  UPLOAD_FAILED: 'storage.file.upload_failed',
  DOWNLOAD_FAILED: 'storage.file.download_failed',
  DELETE_FAILED: 'storage.file.delete_failed',
  NOT_FOUND: 'storage.file.not_found',
  SIGNED_URL_FAILED: 'storage.file.signed_url_failed',

  // Validation errors
  FILE_TOO_LARGE: 'storage.validation.file_too_large',
  MIME_NOT_ALLOWED: 'storage.validation.mime_not_allowed',
  MIME_MISMATCH: 'storage.validation.mime_mismatch',
  EMPTY_FILE: 'storage.validation.empty_file',
  INVALID_FILENAME: 'storage.validation.invalid_filename',

  // Rollback
  ROLLBACK_FAILED: 'storage.rollback.cleanup_failed',

  // Hard delete (purge job only)
  HARD_DELETE_FAILED: 'storage.hard_delete_failed',

  // Event emission (warning-level, not returned to callers)
  EVENT_PUBLISH_FAILED: 'storage.event.publish_failed',
} as const;

// Note: Attachment CRUD error codes (create_failed, not_found, etc.)
// are auto-generated by BaseRepository using the moduleName 'storage'
// (e.g., 'storage.create_failed', 'storage.not_found').
// Do NOT duplicate them here.
```

---

## Task 2 — File Validation Service

### FR Covered: FR-004, SC-004, Edge Cases (MIME spoofing, invalid content, file size)

### File: `src/validation.service.ts`

Validates upload options against configured limits. Returns `Result<ValidatedFile, AppError>`.

```typescript
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { basename } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import type { StorageConfig, UploadOptions } from './types.js';
import { STORAGE_ERRORS } from './errors.js';

/** Sanitized file info after validation */
export interface ValidatedFile {
  sanitizedName: string;
  generatedFileName: string; // UUID v7 + ext
}

export class ValidationService {
  constructor(private readonly config: StorageConfig) {}

  /** Validate upload options against configured limits (synchronous checks) */
  validateUpload(options: UploadOptions): Result<ValidatedFile, AppError> {
    // 1. Check empty file
    if (options.size <= 0) {
      return err(new AppError(STORAGE_ERRORS.EMPTY_FILE));
    }

    // 2. Check file size
    if (options.size > this.config.maxFileSize) {
      return err(
        new AppError(STORAGE_ERRORS.FILE_TOO_LARGE, {
          size: options.size,
          maxSize: this.config.maxFileSize,
        }),
      );
    }

    // 3. Check MIME type against allowed list
    if (!this.config.allowedMimeTypes.includes(options.mimeType)) {
      return err(
        new AppError(STORAGE_ERRORS.MIME_NOT_ALLOWED, {
          mimeType: options.mimeType,
          allowed: this.config.allowedMimeTypes,
        }),
      );
    }

    // 4. Sanitize filename (D2: path.basename + strip special chars)
    const sanitizedName = this.sanitizeFileName(options.originalName);
    if (!sanitizedName) {
      return err(new AppError(STORAGE_ERRORS.INVALID_FILENAME));
    }

    // 5. Generate UUID v7 filename (D2)
    const ext = this.extractExtension(sanitizedName);
    const generatedFileName = `${uuidv7()}${ext}`;

    return ok({ sanitizedName, generatedFileName });
  }

  /** Validate MIME type via magic bytes (Edge Case: MIME spoofing) */
  async validateMimeType(data: Buffer, declaredMime: string): AsyncResult<void, AppError> {
    try {
      const detected = await fileTypeFromBuffer(data);
      // If file-type cannot detect (e.g., text/plain, text/csv), skip magic byte check
      if (detected && detected.mime !== declaredMime) {
        return err(
          new AppError(STORAGE_ERRORS.MIME_MISMATCH, {
            declared: declaredMime,
            detected: detected.mime,
          }),
        );
      }
      return ok(undefined);
    } catch {
      // If detection fails, allow — file-type may not support all formats
      return ok(undefined);
    }
  }

  /** Sanitize filename: path.basename + strip special chars (SC-004) */
  sanitizeFileName(name: string): string {
    const base = basename(name);
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /** Extract file extension including the dot */
  private extractExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1 || lastDot === name.length - 1) return '';
    return name.slice(lastDot);
  }
}
```

---

## Task 3 — LocalProvider

### FR Covered: FR-001, FR-006

### File: `src/providers/local.provider.ts`

Uses native `node:fs/promises` and `node:fs` streams. NO `fs-extra`.

```typescript
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, unlink, stat, access, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from '../contracts.js';
import type { LocalProviderConfig, ProviderUploadResult } from '../types.js';
import { STORAGE_ERRORS } from '../errors.js';

export class LocalProvider implements StorageProvider {
  readonly type = 'local' as const;

  constructor(private readonly config: LocalProviderConfig) {}

  async upload(
    key: string,
    data: Buffer | Readable,
    _contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError> {
    try {
      const filePath = join(this.config.basePath, key);
      await mkdir(dirname(filePath), { recursive: true });

      if (Buffer.isBuffer(data)) {
        await writeFile(filePath, data);
      } else {
        const ws = createWriteStream(filePath);
        await pipeline(data, ws);
      }

      return ok({ providerKey: key });
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, error));
    }
  }

  async download(key: string): AsyncResult<Readable, AppError> {
    try {
      const filePath = join(this.config.basePath, key);
      await access(filePath);
      const stream = createReadStream(filePath);
      return ok(stream);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.NOT_FOUND, error));
    }
  }

  async delete(key: string): AsyncResult<void, AppError> {
    try {
      const filePath = join(this.config.basePath, key);
      await unlink(filePath);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DELETE_FAILED, error));
    }
  }

  async getSignedUrl(key: string, _expiresInSeconds: number): AsyncResult<string, AppError> {
    const filePath = join(this.config.basePath, key);
    try {
      await access(filePath);
      return ok(filePath);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.NOT_FOUND, error));
    }
  }

  async exists(key: string): AsyncResult<boolean, AppError> {
    try {
      const filePath = join(this.config.basePath, key);
      await stat(filePath);
      return ok(true);
    } catch {
      return ok(false);
    }
  }
}
```

---

## Task 4 — S3Provider

### FR Covered: FR-001, FR-006, D5 (encryption)

### File: `src/providers/s3.provider.ts`

Uses `@aws-sdk/client-s3` for operations, `@aws-sdk/lib-storage` `Upload` for streaming uploads (NOT `streamToBuffer` — NFR-005), and `@aws-sdk/s3-request-presigner` for signed URLs. All methods return `AsyncResult<T, AppError>`.

```typescript
import type { Readable } from 'node:stream';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from '../contracts.js';
import type { S3ProviderConfig, ProviderUploadResult } from '../types.js';
import { STORAGE_ERRORS } from '../errors.js';

export class S3Provider implements StorageProvider {
  readonly type = 's3' as const;
  private readonly client: S3Client;

  constructor(private readonly config: S3ProviderConfig) {
    this.client = new S3Client({ region: config.region });
  }

  async upload(
    key: string,
    data: Buffer | Readable,
    contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError> {
    try {
      const params: Record<string, unknown> = {
        Bucket: this.config.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      };

      // D5: Provider-level encryption
      if (this.config.encryptionMode === 'SSE-KMS' && this.config.kmsKeyId) {
        params.ServerSideEncryption = 'aws:kms';
        params.SSEKMSKeyId = this.config.kmsKeyId;
      } else {
        params.ServerSideEncryption = 'AES256'; // SSE-S3 default
      }

      // NFR-005: Use @aws-sdk/lib-storage Upload for streaming
      const upload = new Upload({ client: this.client, params });
      await upload.done();

      return ok({ providerKey: key });
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, error));
    }
  }

  async download(key: string): AsyncResult<Readable, AppError> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        return err(new AppError(STORAGE_ERRORS.NOT_FOUND));
      }
      return ok(response.Body as Readable);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, error));
    }
  }

  async delete(key: string): AsyncResult<void, AppError> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.client.send(command);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DELETE_FAILED, error));
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): AsyncResult<string, AppError> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      const url = await awsGetSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
      return ok(url);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.SIGNED_URL_FAILED, error));
    }
  }

  async exists(key: string): AsyncResult<boolean, AppError> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.client.send(command);
      return ok(true);
    } catch {
      return ok(false);
    }
  }
}
```

---

## Task 5 — DriveProvider

### FR Covered: FR-001, FR-006

### File: `src/providers/drive.provider.ts`

Uses `@googleapis/drive` 8.x. Receives a pre-configured `drive_v3.Drive` client — does NOT manage OAuth2 tokens (per spec constraint). All methods return `AsyncResult<T, AppError>`.

```typescript
import type { Readable } from 'node:stream';
import type { drive_v3 } from '@googleapis/drive';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from '../contracts.js';
import type { DriveProviderConfig, ProviderUploadResult } from '../types.js';
import { STORAGE_ERRORS } from '../errors.js';

export class DriveProvider implements StorageProvider {
  readonly type = 'drive' as const;

  constructor(
    private readonly driveClient: drive_v3.Drive,
    private readonly config: DriveProviderConfig,
  ) {}

  async upload(
    key: string,
    data: Buffer | Readable,
    contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError> {
    try {
      const response = await this.driveClient.files.create({
        requestBody: {
          name: key,
          parents: [this.config.folderId],
        },
        media: { mimeType: contentType, body: data },
        fields: 'id,webViewLink',
      });

      const fileId = response.data.id;
      if (!fileId) {
        return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, 'No file ID returned'));
      }

      return ok({
        providerKey: fileId,
        url: response.data.webViewLink ?? undefined,
      });
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, error));
    }
  }

  async download(key: string): AsyncResult<Readable, AppError> {
    try {
      const response = await this.driveClient.files.get(
        { fileId: key, alt: 'media' },
        { responseType: 'stream' },
      );
      return ok(response.data as Readable);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, error));
    }
  }

  async delete(key: string): AsyncResult<void, AppError> {
    try {
      await this.driveClient.files.delete({ fileId: key });
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DELETE_FAILED, error));
    }
  }

  async getSignedUrl(key: string, _expiresInSeconds: number): AsyncResult<string, AppError> {
    try {
      const response = await this.driveClient.files.get({
        fileId: key,
        fields: 'webViewLink',
      });
      const link = response.data.webViewLink;
      if (!link) {
        return err(new AppError(STORAGE_ERRORS.SIGNED_URL_FAILED, 'No web view link'));
      }
      return ok(link);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.SIGNED_URL_FAILED, error));
    }
  }

  async exists(key: string): AsyncResult<boolean, AppError> {
    try {
      await this.driveClient.files.get({ fileId: key, fields: 'id' });
      return ok(true);
    } catch {
      return ok(false);
    }
  }
}
```

---

## Task 6 — StorageProviderFactory

### FR Covered: FR-001, D1, NFR-004

### File: `src/provider.factory.ts`

Returns `Result<StorageProvider, AppError>`. Validates config before creating provider. DriveProvider requires a separate factory function since it needs a pre-configured auth client.

```typescript
import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from './contracts.js';
import type { StorageConfig, DriveProviderConfig } from './types.js';
import type { drive_v3 } from '@googleapis/drive';
import { LocalProvider } from './providers/local.provider.js';
import { S3Provider } from './providers/s3.provider.js';
import { DriveProvider } from './providers/drive.provider.js';
import { STORAGE_ERRORS } from './errors.js';

/** Create a StorageProvider based on config (D1: Provider Strategy Pattern) */
export function createStorageProvider(config: StorageConfig): Result<StorageProvider, AppError> {
  switch (config.provider) {
    case 'local': {
      if (!config.local) {
        return err(new AppError(STORAGE_ERRORS.PROVIDER_UNKNOWN, 'Missing local provider config'));
      }
      return ok(new LocalProvider(config.local));
    }
    case 's3': {
      if (!config.s3) {
        return err(new AppError(STORAGE_ERRORS.PROVIDER_UNKNOWN, 'Missing S3 provider config'));
      }
      return ok(new S3Provider(config.s3));
    }
    case 'drive':
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          'DriveProvider requires a pre-configured Drive client. Use createDriveProvider().',
        ),
      );
    case 'telegram':
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          'TelegramProvider requires a pre-configured grammY Api instance. Use createTelegramProvider().',
        ),
      );
    default:
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          `Unknown provider: ${String(config.provider)}`,
        ),
      );
  }
}

/** Create a DriveProvider with a pre-configured auth client */
export function createDriveProvider(
  driveClient: drive_v3.Drive,
  config: DriveProviderConfig,
): Result<StorageProvider, AppError> {
  return ok(new DriveProvider(driveClient, config));
}

/** Create a TelegramProvider with pre-configured grammY Api instance */
export function createTelegramProvider(
  api: Api,
  config: TelegramProviderConfig,
): Result<StorageProvider, AppError> {
  return ok(new TelegramProvider(api, config));
}
```

---

## Task 7 — Attachment Prisma Model

### FR Covered: FR-003, Cross-Package Modification

### File Modified: `packages/database/prisma/schema.prisma`

Add the Attachment model per the spec definition. This is the ONLY file modified in `packages/database/`.

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

**Note**: No Prisma migration is run during this task. Migrations require a live database and are run by the deployment pipeline. The model definition is sufficient for type generation.

---

## Task 8 — AttachmentRepository

### FR Covered: FR-003, Rule XIV

### File: `src/attachment.repository.ts`

Extends `BaseRepository<Attachment>` from `@tempot/database`. All CRUD operations inherited from BaseRepository return `AsyncResult<T, AppError>`. Adds domain-specific queries.

```typescript
import type { Result } from '@tempot/shared';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BaseRepository, type IAuditLogger, type PrismaModelDelegate } from '@tempot/database';
import type { Attachment } from './types.js';
import { STORAGE_ERRORS } from './errors.js';

export class AttachmentRepository extends BaseRepository<Attachment> {
  protected moduleName = 'storage';
  protected entityName = 'attachment';

  protected get model(): PrismaModelDelegate {
    return (this.db as Record<string, unknown>).attachment as PrismaModelDelegate;
  }

  /** Find attachments by module and entity */
  async findByModuleAndEntity(
    moduleId: string,
    entityId: string,
  ): Promise<Result<Attachment[], AppError>> {
    return this.findMany({ moduleId, entityId });
  }

  /** Find soft-deleted attachments older than given date (for purge job) */
  async findExpiredDeleted(beforeDate: Date): Promise<Result<Attachment[], AppError>> {
    return this.findMany({
      isDeleted: true,
      deletedAt: { lte: beforeDate },
    });
  }

  /** Permanently delete records by IDs (purge job only — bypasses soft-delete via $executeRaw) */
  async hardDelete(ids: string[]): Promise<Result<void, AppError>> {
    try {
      await this.db.$executeRaw`DELETE FROM "Attachment" WHERE id = ANY(${ids})`;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.HARD_DELETE_FAILED, error));
    }
  }
}
```

---

## Task 9 — StorageService (Orchestrator)

### FR Covered: FR-001 through FR-007, D3, SC-001

### File: `src/storage.service.ts`

The main orchestrator. Coordinates: validation → MIME magic byte check → provider key generation → provider upload → DB record creation → event emission. Handles two-phase rollback (D3).

All public methods return `AsyncResult<T, AppError>`.

```typescript
import type { Readable } from 'node:stream';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { Logger } from '@tempot/logger';
import type { StorageProvider } from './contracts.js';
import type { StorageFileUploadedPayload, StorageFileDeletedPayload } from './contracts.js';
import type { AttachmentRepository } from './attachment.repository.js';
import type { ValidationService } from './validation.service.js';
import type { UploadOptions, Attachment, StorageConfig } from './types.js';
import { STORAGE_ERRORS } from './errors.js';

/** Dependencies for StorageService (grouped to stay under Rule II param limit) */
export interface StorageServiceDeps {
  provider: StorageProvider;
  attachmentRepo: AttachmentRepository;
  validation: ValidationService;
  eventBus: EventBusOrchestrator;
  logger: Logger;
  config: StorageConfig;
}

export class StorageService {
  private readonly provider: StorageProvider;
  private readonly attachmentRepo: AttachmentRepository;
  private readonly validation: ValidationService;
  private readonly eventBus: EventBusOrchestrator;
  private readonly logger: Logger;
  private readonly config: StorageConfig;

  constructor(deps: StorageServiceDeps) {
    this.provider = deps.provider;
    this.attachmentRepo = deps.attachmentRepo;
    this.validation = deps.validation;
    this.eventBus = deps.eventBus;
    this.logger = deps.logger;
    this.config = deps.config;
  }

  /** Upload a file: validate → MIME check → upload to provider → create DB record → emit event (D3) */
  async upload(data: Buffer | Readable, options: UploadOptions): AsyncResult<Attachment, AppError> {
    // 1. Validate (synchronous checks)
    const validationResult = this.validation.validateUpload(options);
    if (validationResult.isErr()) return err(validationResult.error);
    const { sanitizedName, generatedFileName } = validationResult.value;

    // 2. MIME magic byte validation (if data is a Buffer)
    // Streams skip magic byte check — buffering would violate NFR-005
    if (Buffer.isBuffer(data)) {
      const mimeResult = await this.validation.validateMimeType(data, options.mimeType);
      if (mimeResult.isErr()) return err(mimeResult.error);
    }

    // 3. Generate provider key (D2: UUID v7 path)
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const modulePrefix = options.moduleId ?? 'general';
    const providerKey = `${modulePrefix}/${yearMonth}/${generatedFileName}`;

    // 4. Upload to provider (Phase 1 of D3)
    const uploadResult = await this.provider.upload(providerKey, data, options.mimeType);
    if (uploadResult.isErr()) return err(uploadResult.error);

    // 5. Determine isEncrypted based on provider config (D5)
    const isEncrypted = this.resolveEncryptionStatus();

    // 6. Create Attachment record (Phase 2 of D3)
    const createResult = await this.attachmentRepo.create({
      fileName: generatedFileName,
      originalName: sanitizedName,
      mimeType: options.mimeType,
      size: options.size,
      provider: this.provider.type,
      providerKey: uploadResult.value.providerKey,
      url: uploadResult.value.url ?? null,
      metadata: options.metadata ?? null,
      moduleId: options.moduleId ?? null,
      entityId: options.entityId ?? null,
      isEncrypted,
    });

    if (createResult.isErr()) {
      // D3: Best-effort rollback — check result and log on failure
      const rollbackResult = await this.provider.delete(providerKey);
      if (rollbackResult.isErr()) {
        this.logger.warn({
          code: STORAGE_ERRORS.ROLLBACK_FAILED,
          providerKey,
          provider: this.provider.type,
          originalError: createResult.error.code,
          rollbackError: rollbackResult.error.code,
        });
      }
      return err(createResult.error);
    }

    // 7. Emit storage.file.uploaded event (FR-007) — fire-and-log pattern
    const attachment = createResult.value;
    const uploadedPayload: StorageFileUploadedPayload = {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      provider: attachment.provider,
      moduleId: options.moduleId,
      entityId: options.entityId,
      uploadedBy: attachment.createdBy ?? undefined,
    };
    const publishResult = await this.eventBus.publish('storage.file.uploaded', uploadedPayload);
    if (publishResult.isErr()) {
      this.logger.warn({
        code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
        event: 'storage.file.uploaded',
        attachmentId: attachment.id,
        error: publishResult.error.code,
      });
    }

    return ok(attachment);
  }

  /** Download a file by attachment ID */
  async download(attachmentId: string): AsyncResult<Readable, AppError> {
    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    return this.provider.download(findResult.value.providerKey);
  }

  /** Soft delete an attachment (D6: deferred purge) */
  async delete(attachmentId: string): AsyncResult<void, AppError> {
    // Look up attachment first for event payload
    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    const attachment = findResult.value;

    // Soft delete
    const deleteResult = await this.attachmentRepo.delete(attachmentId);
    if (deleteResult.isErr()) return err(deleteResult.error);

    // Emit storage.file.deleted event — fire-and-log pattern (FR-007, D6)
    const deletedPayload: StorageFileDeletedPayload = {
      attachmentId: attachment.id,
      provider: attachment.provider,
      providerKey: attachment.providerKey,
      deletedBy: attachment.updatedBy ?? undefined,
      permanent: false,
    };
    const publishResult = await this.eventBus.publish('storage.file.deleted', deletedPayload);
    if (publishResult.isErr()) {
      this.logger.warn({
        code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
        event: 'storage.file.deleted',
        attachmentId: attachment.id,
        error: publishResult.error.code,
      });
    }

    return ok(undefined);
  }

  /** Get a signed/shareable URL for an attachment */
  async getSignedUrl(
    attachmentId: string,
    expiresInSeconds: number = 3600,
  ): AsyncResult<string, AppError> {
    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    return this.provider.getSignedUrl(findResult.value.providerKey, expiresInSeconds);
  }

  /** Find attachments by module and entity */
  async findByModuleAndEntity(
    moduleId: string,
    entityId: string,
  ): AsyncResult<Attachment[], AppError> {
    return this.attachmentRepo.findByModuleAndEntity(moduleId, entityId);
  }

  /** Resolve isEncrypted flag based on provider type and config (D5) */
  private resolveEncryptionStatus(): boolean {
    switch (this.provider.type) {
      case 's3':
        return true; // SSE-S3 or SSE-KMS always encrypts
      case 'drive':
        return true; // Google Drive encrypts by default
      case 'local':
        return false;
      default:
        return false;
    }
  }
}
```

---

## Task 10 — Event Registration

### FR Covered: FR-007

### File Modified: `packages/event-bus/src/events.ts`

Add storage events to the `TempotEvents` interface with typed payloads defined **inline** (to avoid circular dependency — event-bus must NOT import from storage-engine):

```typescript
export interface TempotEvents {
  'session-manager.session.updated': { userId: string; chatId: string; sessionData: unknown };
  'storage.file.uploaded': {
    attachmentId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    provider: string;
    moduleId?: string;
    entityId?: string;
    uploadedBy?: string;
  };
  'storage.file.deleted': {
    attachmentId: string;
    provider: string;
    providerKey: string;
    deletedBy?: string;
    permanent: boolean;
  };
}
```

The inline types must structurally match `StorageFileUploadedPayload` and `StorageFileDeletedPayload` from `@tempot/storage-engine/src/contracts.ts`. This is the ONLY file modified in `packages/event-bus/`.

---

## Task 11 — Deferred Deletion Job

### FR Covered: FR-005, D6

### File: `src/jobs/purge.job.ts`

BullMQ worker that:

1. Queries `AttachmentRepository.findExpiredDeleted(beforeDate)` where `beforeDate = now - retentionDays`
2. For each expired record: deletes file from provider, then permanently removes DB record
3. Emits `storage.file.deleted` with `permanent: true` for each permanently deleted file
4. Uses `queueFactory()` from `@tempot/shared` to create the queue
5. Uses `@tempot/logger` for structured logging — NO `console.*`

**Note**: The orphan cleanup job (files in provider without matching DB records, spec edge case) is a separate concern. It is NOT implemented in this task — it will be added as a follow-up task if orphan frequency justifies it.

```typescript
import { queueFactory } from '@tempot/shared';

// Queue creation
const queueResult = queueFactory('storage-purge');
// Worker processes jobs by calling provider.delete() + hard-delete from DB
```

---

## Task 12 — Barrel Exports

### File: `src/index.ts`

All public types, interfaces, constants, services, providers, and the factory are exported. Uses `.js` extensions on all relative imports.

---

## Testing Strategy

### Unit Tests (vitest)

| Test File                    | What It Tests                                                                             | Key Assertions                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `validation.service.test.ts` | File size limits, MIME validation, filename sanitization, empty files, UUID v7 generation | `isOk()`, `isErr()`, error codes match `STORAGE_ERRORS`           |
| `local.provider.test.ts`     | Upload/download/delete/exists with real temp directories                                  | File written to disk, stream readable, deleted file gone          |
| `s3.provider.test.ts`        | S3 operations with mocked `@aws-sdk/client-s3`                                            | Correct AWS commands sent, error wrapping, SSE params             |
| `drive.provider.test.ts`     | Drive operations with mocked `@googleapis/drive`                                          | Correct API calls, error wrapping, Drive-specific behavior        |
| `provider.factory.test.ts`   | Factory creates correct provider, rejects unknown                                         | `isOk()` with correct type, `isErr()` for invalid config          |
| `storage.service.test.ts`    | Two-phase upload, rollback, download, delete, getSignedUrl                                | Provider + repo mocked, verify call order, rollback on DB failure |

### Integration Tests (deferred)

S3, Google Drive, and Telegram integration tests require live credentials/bots and are NOT in scope. LocalProvider tests use real filesystem (temp directories).

---

## Dependencies Summary

| Dependency                      | Version      | Purpose                                    | Runtime/Dev |
| ------------------------------- | ------------ | ------------------------------------------ | ----------- |
| `neverthrow`                    | 8.2.0        | Result pattern                             | runtime     |
| `@tempot/shared`                | workspace:\* | AppError, Result/AsyncResult, QueueFactory | runtime     |
| `@tempot/database`              | workspace:\* | BaseRepository, Prisma client              | runtime     |
| `@tempot/event-bus`             | workspace:\* | Event publishing                           | runtime     |
| `@tempot/session-manager`       | workspace:\* | Session context for audit fields           | runtime     |
| `@tempot/logger`                | workspace:\* | Structured logging (Pino)                  | runtime     |
| `@aws-sdk/client-s3`            | 3.x          | S3 operations                              | runtime     |
| `@aws-sdk/s3-request-presigner` | 3.x          | S3 pre-signed URLs                         | runtime     |
| `@aws-sdk/lib-storage`          | 3.x          | S3 streaming upload                        | runtime     |
| `@googleapis/drive`             | 8.x          | Google Drive API                           | runtime     |
| `grammy`                        | 1.41.1       | Telegram Bot API (Api, InputFile)          | runtime     |
| `file-type`                     | 19.x         | MIME magic byte detection                  | runtime     |
| `uuid`                          | 11.x         | UUID v7 generation                         | runtime     |
| `typescript`                    | 5.9.3        | Build                                      | dev         |
| `vitest`                        | 4.1.0        | Testing                                    | dev         |
| `@types/uuid`                   | 10.x         | UUID type definitions                      | dev         |
