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
export type {
  StorageProvider,
  StorageFileUploadedPayload,
  StorageFileDeletedPayload,
} from './contracts.js';

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
