import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, unlink, stat, access, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageProvider } from '../storage.contracts.js';
import type { LocalProviderConfig, ProviderUploadResult } from '../storage.types.js';
import { STORAGE_ERRORS } from '../storage.errors.js';

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
