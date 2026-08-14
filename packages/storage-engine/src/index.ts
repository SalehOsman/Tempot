// Toggle guard (Rule XVI)
export { storageToggle } from './storage.toggle.js';

// Types
export type {
  StorageProviderType,
  StorageConfig,
  LocalProviderConfig,
  S3ProviderConfig,
  DriveProviderConfig,
  TelegramProviderConfig,
  RetentionConfig,
  UploadOptions,
  ProviderUploadResult,
  Attachment,
  VectorIndexer,
} from './storage.types.js';
export { DEFAULT_STORAGE_CONFIG } from './storage.types.js';

// Contracts
export type {
  StorageProvider,
  StorageFileUploadedPayload,
  StorageFileDeletedPayload,
} from './storage.contracts.js';

// Errors
export { STORAGE_ERRORS } from './storage.errors.js';

// Validation
export { ValidationService } from './validation.service.js';
export type { ValidatedFile } from './validation.service.js';

// Providers
export { LocalProvider } from './providers/local.provider.js';
export { S3Provider } from './providers/s3.provider.js';
export { DriveProvider } from './providers/drive.provider.js';
export { TelegramProvider } from './providers/telegram.provider.js';

// Factory
export {
  createStorageProvider,
  createDriveProvider,
  createTelegramProvider,
} from './provider.factory.js';

// Repository
export { AttachmentRepository } from './attachment.repository.js';

// Service
export { StorageService } from './storage.service.js';

// Service interfaces (for DI consumers)
export type {
  StorageLogger,
  StorageEventBus,
  StorageAttachmentRepo,
  StorageValidation,
  StorageServiceDeps,
} from './storage.interfaces.js';

// Purge job
export { processPurge, createPurgeQueue } from './jobs/purge.job.js';
export type { PurgeDeps } from './jobs/purge.job.js';
