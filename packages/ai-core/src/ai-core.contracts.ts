import type { EmbeddingModel, LanguageModel } from 'ai';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Structural interface for the AI provider registry */
export interface AIRegistry {
  languageModel: (id: string) => LanguageModel;
  textEmbeddingModel: (id: string) => EmbeddingModel;
}

/** Structural interface for logger dependency */
export interface AILogger {
  info: (data: object) => void;
  warn: (data: object) => void;
  error: (data: object) => void;
  debug: (data: object) => void;
}

/** Structural interface for event bus dependency */
export interface AIEventBus {
  publish: (eventName: string, payload: unknown) => AsyncResult<void, AppError>;
  subscribe: (eventName: string, handler: (payload: unknown) => void) => void;
}

/** Structural interface for cache dependency */
export interface AICache {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

/** Structural interface for CASL ability check */
export interface AIAbilityChecker {
  can: (action: string, subject: string) => boolean;
}
