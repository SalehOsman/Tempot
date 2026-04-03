import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { InputEngineLogger } from '../input-engine.contracts.js';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';

/** Structural interface matching CacheService from @tempot/shared */
interface CacheAdapter {
  get: <T>(key: string) => AsyncResult<T | undefined, AppError>;
  set: <T>(key: string, value: T, ttl?: number) => AsyncResult<void, AppError>;
  del: (key: string) => AsyncResult<void, AppError>;
}

/** Custom conversations storage adapter using CacheService */
export class ConversationsStorageAdapter {
  constructor(
    private readonly cache: CacheAdapter,
    private readonly logger: InputEngineLogger,
    private readonly ttlMs: number = 86_400_000, // 24 hours default
  ) {}

  /** Read conversation state from Redis */
  async read(key: string): Promise<unknown | undefined> {
    const result = await this.cache.get<unknown>(key);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_RESTORE_FAILED,
        key,
        error: result.error.code,
      });
      return undefined; // Graceful degradation
    }
    return result.value;
  }

  /** Write conversation state to Redis */
  async write(key: string, value: unknown): Promise<void> {
    const result = await this.cache.set(key, value, this.ttlMs);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_FAILED,
        key,
        error: result.error.code,
      });
      // Graceful degradation — don't throw
    }
  }

  /** Delete conversation state from Redis */
  async delete(key: string): Promise<void> {
    const result = await this.cache.del(key);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_FAILED,
        key,
        error: result.error.code,
      });
    }
  }
}
