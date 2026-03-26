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
      if (!this.isReadable(response.Body)) {
        return err(
          new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, 'Response body is not a readable stream'),
        );
      }
      return ok(response.Body);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.DOWNLOAD_FAILED, error));
    }
  }

  /** Runtime guard: check if a value is a Readable stream */
  private isReadable(value: unknown): value is Readable {
    return (
      typeof value === 'object' && value !== null && typeof (value as Readable).pipe === 'function'
    );
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
      const url = await awsGetSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      });
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
