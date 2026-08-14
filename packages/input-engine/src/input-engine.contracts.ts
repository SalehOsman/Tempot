import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Structural interface for storage-engine dependency (optional) */
export interface StorageEngineClient {
  upload: (
    file: Buffer,
    options: { filename: string; mimeType: string },
  ) => AsyncResult<string, AppError>;
  validate: (
    file: Buffer,
    constraints: { maxSizeKB?: number; allowedTypes?: string[] },
  ) => AsyncResult<void, AppError>;
}

/** Structural interface for ai-core extraction dependency (optional) */
export interface AIExtractionClient {
  extract: (
    input: string,
    targetFields: string[],
  ) => AsyncResult<Record<string, unknown>, AppError>;
  isAvailable: () => boolean;
}

/** Structural interface for regional-engine dependency (optional) */
export interface RegionalClient {
  getStates: () => AsyncResult<Array<{ id: string; name: string }>, AppError>;
  getCities: (stateId: string) => AsyncResult<Array<{ id: string; name: string }>, AppError>;
}

/** Structural interface for logger dependency */
export interface InputEngineLogger {
  info: (data: object) => void;
  warn: (data: object) => void;
  error: (data: object) => void;
  debug: (data: object) => void;
}

/** Structural interface for event bus dependency */
export interface InputEngineEventBus {
  publish: (eventName: string, payload: unknown) => AsyncResult<void, AppError>;
}
