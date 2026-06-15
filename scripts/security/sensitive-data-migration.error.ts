import { AppError } from '@tempot/shared';

export const MIGRATION_DATABASE_ERROR = 'database.protection.migration_database_failed';
export const MIGRATION_CONCURRENT_UPDATE_ERROR = 'database.protection.migration_concurrent_update';
export const MIGRATION_VERIFICATION_ERROR = 'database.protection.migration_verification_failed';

export function migrationDatabaseError(operation: string): AppError {
  return new AppError(MIGRATION_DATABASE_ERROR, { operation });
}

export function migrationConcurrentUpdateError(recordId: string): AppError {
  return new AppError(MIGRATION_CONCURRENT_UPDATE_ERROR, { recordId });
}
