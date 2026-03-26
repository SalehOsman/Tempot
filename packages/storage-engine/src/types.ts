import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Storage provider identifier */
export type StorageProviderType = 'local' | 's3' | 'drive';

/** Configuration for storage engine */
export interface StorageConfig {
  provider: StorageProviderType;
  maxFileSize: number; // bytes, default 10MB
  allowedMimeTypes: string[];
  local?: LocalProviderConfig;
  s3?: S3ProviderConfig;
  drive?: DriveProviderConfig;
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
