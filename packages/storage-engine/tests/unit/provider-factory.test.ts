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
