import type { Api } from 'grammy';
import { InputFile } from 'grammy';
import { Readable } from 'node:stream';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from '../contracts.js';
import type { ProviderUploadResult, TelegramProviderConfig } from '../types.js';
import { STORAGE_ERRORS } from '../errors.js';

export class TelegramProvider implements StorageProvider {
  readonly type = 'telegram' as const;

  constructor(
    private readonly api: Api,
    private readonly config: TelegramProviderConfig,
  ) {}

  async upload(
    key: string,
    data: Buffer | Readable,
    _contentType: string,
  ): AsyncResult<ProviderUploadResult, AppError> {
    try {
      const inputFile = new InputFile(data);
      const message = await this.api.sendDocument(
        this.config.storageChatId,
        inputFile,
        { caption: key },
      );

      const fileId = message.document?.file_id;
      if (!fileId) {
        return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, 'No file_id in response'));
      }

      return ok({ providerKey: fileId });
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, error));
    }
  }

  async download(key: string): AsyncResult<Readable, AppError> {
    try {
      const file = await this.api.getFile(key);
      if (!file.file_path) {
        return err(new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, 'No file_path in response'));
      }

      const url = this.buildDownloadUrl(file.file_path);
      const response = await fetch(url);

      if (!response.ok || !response.body) {
        return err(
          new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, `HTTP ${response.status}`),
        );
      }

      const nodeStream = Readable.fromWeb(
        response.body as import('node:stream/web').ReadableStream,
      );
      return ok(nodeStream);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, error));
    }
  }

  /**
   * No-op — Telegram does not support file deletion by file_id.
   * Files remain on Telegram servers but are inaccessible without the file_id.
   */
  async delete(_key: string): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  /**
   * Get a download URL for the file.
   *
   * @remarks
   * Returns a temporary download URL from Telegram's getFile API.
   * Valid for at least 1 hour (server-controlled).
   * The `expiresInSeconds` parameter is ignored.
   */
  async getSignedUrl(key: string, _expiresInSeconds: number): AsyncResult<string, AppError> {
    try {
      const file = await this.api.getFile(key);
      if (!file.file_path) {
        return err(new AppError(STORAGE_ERRORS.SIGNED_URL_FAILED, 'No file_path in response'));
      }

      return ok(this.buildDownloadUrl(file.file_path));
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.SIGNED_URL_FAILED, error));
    }
  }

  async exists(key: string): AsyncResult<boolean, AppError> {
    try {
      await this.api.getFile(key);
      return ok(true);
    } catch {
      return ok(false);
    }
  }

  /** Build the Bot API file download URL */
  private buildDownloadUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.api.token}/${filePath}`;
  }
}
