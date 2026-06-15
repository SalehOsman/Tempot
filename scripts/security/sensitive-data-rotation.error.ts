import { AppError } from '@tempot/shared';

export const ROTATION_DATABASE_ERROR = 'database.protection.rotation_database_failed';
export const ROTATION_CONCURRENT_UPDATE_ERROR = 'database.protection.rotation_concurrent_update';

export function rotationDatabaseError(operation: string): AppError {
  return new AppError(ROTATION_DATABASE_ERROR, { operation });
}

export function rotationConcurrentUpdateError(recordId: string): AppError {
  return new AppError(ROTATION_CONCURRENT_UPDATE_ERROR, { recordId });
}
