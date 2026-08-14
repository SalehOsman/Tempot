import type { Readable } from 'node:stream';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { StorageProviderType, ProviderUploadResult } from './storage.types.js';

/**
 * Abstract storage provider interface (FR-001).
 *
 * Implementations: LocalProvider, S3Provider, DriveProvider, TelegramProvider.
 * All methods return `AsyncResult<T, AppError>` — no thrown exceptions.
 */
export interface StorageProvider {
  readonly type: StorageProviderType;

  upload(
    key: string,
    data: Buffer | Readable,
    contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError>;

  download(key: string): AsyncResult<Readable, AppError>;

  delete(key: string): AsyncResult<void, AppError>;

  /**
   * Get an access URL for the file.
   *
   * @remarks
   * Behavior varies by provider:
   * - **S3**: Returns a time-limited pre-signed URL. The `expiresInSeconds` parameter
   *   controls URL lifetime.
   * - **Google Drive**: Returns a `webViewLink` that requires Google authentication and
   *   appropriate sharing permissions. The `expiresInSeconds` parameter is not applicable
   *   and is ignored.
   * - **Local**: Returns the absolute filesystem path after verifying the file exists.
   *   The `expiresInSeconds` parameter is not applicable.
   * - **Telegram**: Returns a temporary download URL from Telegram's getFile API.
   *   Valid for at least 1 hour (server-controlled). The `expiresInSeconds` parameter
   *   is not applicable and is ignored.
   */
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
