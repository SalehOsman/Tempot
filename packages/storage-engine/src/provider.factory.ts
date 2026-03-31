import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { drive_v3 } from '@googleapis/drive';
import type { Api } from 'grammy';
import type { StorageProvider } from './storage.contracts.js';
import type {
  StorageConfig,
  DriveProviderConfig,
  TelegramProviderConfig,
} from './storage.types.js';
import { LocalProvider } from './providers/local.provider.js';
import { S3Provider } from './providers/s3.provider.js';
import { DriveProvider } from './providers/drive.provider.js';
import { TelegramProvider } from './providers/telegram.provider.js';
import { STORAGE_ERRORS } from './storage.errors.js';

/** Create a StorageProvider based on config (D1: Provider Strategy Pattern) */
export function createStorageProvider(config: StorageConfig): Result<StorageProvider, AppError> {
  switch (config.provider) {
    case 'local': {
      if (!config.local) {
        return err(new AppError(STORAGE_ERRORS.PROVIDER_UNKNOWN, 'Missing local provider config'));
      }
      return ok(new LocalProvider(config.local));
    }
    case 's3': {
      if (!config.s3) {
        return err(new AppError(STORAGE_ERRORS.PROVIDER_UNKNOWN, 'Missing S3 provider config'));
      }
      return ok(new S3Provider(config.s3));
    }
    case 'drive':
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          'DriveProvider requires a pre-configured Drive client. Use createDriveProvider().',
        ),
      );
    case 'telegram':
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          'TelegramProvider requires a grammY Api instance. Use createTelegramProvider().',
        ),
      );
    default:
      return err(
        new AppError(
          STORAGE_ERRORS.PROVIDER_UNKNOWN,
          `Unknown provider: ${String(config.provider)}`,
        ),
      );
  }
}

/** Create a DriveProvider with a pre-configured auth client */
export function createDriveProvider(
  driveClient: drive_v3.Drive,
  config: DriveProviderConfig,
): Result<StorageProvider, AppError> {
  return ok(new DriveProvider(driveClient, config));
}

/** Create a TelegramProvider with a pre-configured grammY Api instance */
export function createTelegramProvider(
  api: Api,
  config: TelegramProviderConfig,
): Result<StorageProvider, AppError> {
  return ok(new TelegramProvider(api, config));
}
