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

  /**
   * Get an access URL for the file in Google Drive.
   *
   * @remarks
   * Returns the `webViewLink` which requires Google authentication and appropriate
   * sharing permissions. The `expiresInSeconds` parameter is NOT applicable for
   * Google Drive and is ignored — Drive links do not expire.
   *
   * This is polymorphic behavior as defined in the spec (Design Concern 6):
   * S3 returns a time-limited pre-signed URL, while Drive returns a persistent
   * webViewLink that depends on sharing settings.
   */
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
