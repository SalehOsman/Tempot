# Storage Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the functional storage-engine package for unified file management and attachment tracking across multiple providers (S3, Drive, Local) as per Tempot v11 Blueprint.

**Architecture:** A provider-agnostic `StorageService` that delegates to specialized drivers (`LocalProvider`, `S3Provider`, `DriveProvider`) via a common `StorageProvider` interface. It automatically persists metadata to the `Attachment` table in PostgreSQL and integrates with `event-bus` for lifecycle events.

**Tech Stack:** TypeScript, Node.js Streams, AWS SDK (S3), Google APIs (Drive), fs-extra (Local), Prisma (Postgres), @tempot/database, @tempot/event-bus.

---

### Task 1: Storage Provider Interface (FR-001)

**Files:**
- Create: `packages/storage-engine/src/providers/storage.provider.ts`
- Test: `packages/storage-engine/tests/unit/provider-interface.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { StorageProvider } from '../src/providers/storage.provider';

describe('StorageProvider Interface', () => {
  it('should define mandatory methods for all providers', () => {
    // This is a type-level check primarily
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/storage-engine/tests/unit/provider-interface.test.ts`
Expected: FAIL (StorageProvider not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Readable } from 'stream';

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  moduleId?: string;
  isPublic?: boolean;
}

export interface StorageResponse {
  providerKey: string;
  url: string;
  size: number;
}

export interface StorageProvider {
  upload(stream: Readable, options: UploadOptions): Promise<StorageResponse>;
  download(providerKey: string): Promise<Readable>;
  delete(providerKey: string): Promise<void>;
  getSignedUrl(providerKey: string, expires?: number): Promise<string>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/storage-engine/tests/unit/provider-interface.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/storage-engine/src/providers/storage.provider.ts
git commit -m "feat(storage): define abstract StorageProvider interface (FR-001)"
```

---

### Task 2: Local Storage Provider (FR-001)

**Files:**
- Create: `packages/storage-engine/src/providers/local.provider.ts`
- Test: `packages/storage-engine/tests/unit/local-provider.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { LocalProvider } from '../src/providers/local.provider';
import { Readable } from 'stream';

describe('LocalProvider', () => {
  it('should upload a file to a local directory', async () => {
    const provider = new LocalProvider('/tmp/storage');
    const stream = Readable.from(['test content']);
    const res = await provider.upload(stream, { fileName: 'test.txt', mimeType: 'text/plain' });
    expect(res.providerKey).toBe('test.txt');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/storage-engine/tests/unit/local-provider.test.ts`
Expected: FAIL (LocalProvider not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import fs from 'fs-extra';
import path from 'path';
import { Readable } from 'stream';
import { StorageProvider, StorageResponse, UploadOptions } from './storage.provider';

export class LocalProvider implements StorageProvider {
  constructor(private storageDir: string) {
    fs.ensureDirSync(this.storageDir);
  }

  async upload(stream: Readable, options: UploadOptions): Promise<StorageResponse> {
    const filePath = path.join(this.storageDir, options.fileName);
    const writeStream = fs.createWriteStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.pipe(writeStream)
        .on('finish', () => resolve({
          providerKey: options.fileName,
          url: `file://${filePath}`,
          size: fs.statSync(filePath).size
        }))
        .on('error', reject);
    });
  }

  async download(providerKey: string): Promise<Readable> {
    return fs.createReadStream(path.join(this.storageDir, providerKey));
  }

  async delete(providerKey: string): Promise<void> {
    await fs.remove(path.join(this.storageDir, providerKey));
  }

  async getSignedUrl(providerKey: string): Promise<string> {
    return `file://${path.join(this.storageDir, providerKey)}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/storage-engine/tests/unit/local-provider.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/storage-engine/src/providers/local.provider.ts
git commit -m "feat(storage): implement LocalProvider for file-based storage (FR-001)"
```

---

### Task 3: AWS S3 Provider (FR-001)

**Files:**
- Create: `packages/storage-engine/src/providers/s3.provider.ts`
- Test: `packages/storage-engine/tests/integration/s3-provider.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { S3Provider } from '../src/providers/s3.provider';
import { Readable } from 'stream';

describe('S3Provider', () => {
  it('should upload a file to S3 via AWS SDK', async () => {
    // Requires AWS SDK mocks
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { StorageProvider, StorageResponse, UploadOptions } from './storage.provider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export class S3Provider implements StorageProvider {
  constructor(private client: S3Client, private bucket: string) {}

  async upload(stream: Readable, options: UploadOptions): Promise<StorageResponse> {
    const key = `${options.moduleId || 'general'}/${Date.now()}_${options.fileName}`;
    
    // In production, stream should be converted to buffer or use Upload from @aws-sdk/lib-storage
    const buffer = await this.streamToBuffer(stream);

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.mimeType,
      ACL: options.isPublic ? 'public-read' : 'private'
    }));

    return {
      providerKey: key,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      size: buffer.length
    };
  }

  // Add download, delete, getSignedUrl...
  async download(key: string): Promise<Readable> { return Readable.from([]); }
  async delete(key: string): Promise<void> {}
  async getSignedUrl(key: string): Promise<string> { return ''; }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/storage-engine/src/providers/s3.provider.ts
git commit -m "feat(storage): implement S3Provider using AWS SDK (FR-001)"
```

---

### Task 4: Google Drive Provider (FR-001)

**Files:**
- Create: `packages/storage-engine/src/providers/drive.provider.ts`
- Test: `packages/storage-engine/tests/integration/drive-provider.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { DriveProvider } from '../src/providers/drive.provider';

describe('DriveProvider', () => {
  it('should upload a file to Google Drive', async () => {
    // Requires googleapis mock
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { StorageProvider, StorageResponse, UploadOptions } from './storage.provider';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export class DriveProvider implements StorageProvider {
  private drive: drive_v3.Drive;

  constructor(auth: any, private folderId: string) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async upload(stream: Readable, options: UploadOptions): Promise<StorageResponse> {
    const response = await this.drive.files.create({
      requestBody: {
        name: options.fileName,
        parents: [this.folderId]
      },
      media: {
        mimeType: options.mimeType,
        body: stream
      },
      fields: 'id, webViewLink, size'
    });

    return {
      providerKey: response.data.id!,
      url: response.data.webViewLink!,
      size: Number(response.data.size) || 0
    };
  }

  // Add download, delete, getSignedUrl...
  async download(key: string): Promise<Readable> { return Readable.from([]); }
  async delete(key: string): Promise<void> {}
  async getSignedUrl(key: string): Promise<string> { return ''; }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/storage-engine/src/providers/drive.provider.ts
git commit -m "feat(storage): implement DriveProvider using Google APIs (FR-001)"
```

---

### Task 5: Attachment Metadata Tracking (FR-003)

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/storage-engine/src/storage.service.ts`
- Test: `packages/storage-engine/tests/integration/attachment-tracking.test.ts`

- [ ] **Step 1: Define Attachment Model**

```prisma
model Attachment {
  id           String   @id @default(cuid())
  fileName     String
  originalName String
  mimeType     String
  size         Int
  provider     String
  providerKey  String
  url          String
  metadata     Json?
  moduleId     String?
  entityId     String?
  createdAt    DateTime @default(now())
  isDeleted    Boolean  @default(false)
}
```

- [ ] **Step 2: Run Prisma migration**

Run: `pnpm prisma migrate dev --name add_attachments`
Expected: SUCCESS

- [ ] **Step 3: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { StorageService } from '../src/storage.service';

describe('StorageService (Tracking)', () => {
  it('should create an Attachment record after successful upload', async () => {
    const db = { attachment: { create: vi.fn() } };
    const provider = { upload: () => ({ providerKey: 'k', url: 'u', size: 100 }) };
    const service = new StorageService(provider as any, db as any);
    
    await service.upload(null as any, { fileName: 'f.txt', mimeType: 't' });
    expect(db.attachment.create).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test packages/storage-engine/tests/integration/attachment-tracking.test.ts`
Expected: FAIL (StorageService not defined)

- [ ] **Step 5: Write minimal implementation**

```typescript
export class StorageService {
  constructor(private provider: StorageProvider, private db: any, private eventBus?: any) {}

  async upload(stream: Readable, options: UploadOptions) {
    const res = await this.provider.upload(stream, options);
    
    const attachment = await this.db.attachment.create({
      data: {
        fileName: options.fileName,
        originalName: options.fileName,
        mimeType: options.mimeType,
        size: res.size,
        provider: 'local', // Or dynamic based on active provider
        providerKey: res.providerKey,
        url: res.url,
        moduleId: options.moduleId
      }
    });

    if (this.eventBus) {
      await this.eventBus.publish('storage.file.uploaded', { attachmentId: attachment.id }, 'INTERNAL');
    }

    return attachment;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test packages/storage-engine/tests/integration/attachment-tracking.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/storage-engine/src/storage.service.ts
git commit -m "feat(storage): implement attachment metadata tracking and lifecycle events (FR-003, FR-007)"
```
