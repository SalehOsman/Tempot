import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { UploadOptions, Attachment } from './storage.types.js';

/**
 * Minimal logger interface to avoid circular dependency with @tempot/logger.
 * Structurally compatible with pino.Logger.
 */
export interface StorageLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
}

/**
 * Minimal event bus interface to avoid importing @tempot/event-bus at runtime.
 * Structurally compatible with EventBusOrchestrator.
 */
export interface StorageEventBus {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

/** Result shape returned by repository methods */
export interface RepoResult<T> {
  isOk(): boolean;
  isErr(): boolean;
  value: T;
  error: AppError;
}

/**
 * Minimal attachment repository interface for dependency injection.
 * Matches the methods used by StorageService from AttachmentRepository.
 */
export interface StorageAttachmentRepo {
  create(data: Record<string, unknown>): Promise<RepoResult<Attachment>>;
  findById(id: string): Promise<RepoResult<Attachment>>;
  delete(id: string): Promise<RepoResult<void>>;
  findByModuleAndEntity(moduleId: string, entityId: string): Promise<RepoResult<Attachment[]>>;
}

/**
 * Minimal validation service interface for dependency injection.
 * Matches the methods used by StorageService from ValidationService.
 */
export interface StorageValidation {
  validateUpload(options: UploadOptions): {
    isOk(): boolean;
    isErr(): boolean;
    value: { sanitizedName: string; generatedFileName: string };
    error: AppError;
  };
  validateMimeType(
    data: Buffer,
    declaredMime: string,
  ): Promise<{ isOk(): boolean; isErr(): boolean; error: AppError }>;
}
