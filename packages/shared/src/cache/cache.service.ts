import { createCache, Cache } from 'cache-manager';
import { ok, err } from 'neverthrow';
import { AsyncResult } from '../result';
import { AppError } from '../errors';

export interface EventBus {
  publish(event: string, payload: unknown, type: 'LOCAL' | 'INTERNAL' | 'EXTERNAL'): Promise<void>;
}

/**
 * Logger interface for CacheService.
 * Minimal to avoid circular dep with @tempot/logger.
 */
export interface CacheLogger {
  warn: (message: string) => void;
}

/**
 * Unified Cache Service wrapper around cache-manager
 * Rule: XIX (Cache via cache-manager ONLY), XXI (Result Pattern)
 */
export class CacheService {
  private cache?: Cache;

  constructor(
    private eventBus?: EventBus,
    private logger?: CacheLogger,
  ) {}

  /**
   * Initialize the cache store.
   * Returns AsyncResult — no thrown exceptions, no console output.
   * On failure, falls back to memory cache and publishes alert.
   */
  async init(): AsyncResult<void> {
    try {
      this.cache = createCache();
      return ok(undefined);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);

      if (this.logger) {
        this.logger.warn(`Cache initialization failed, falling back to memory: ${errorMessage}`);
      }

      if (this.eventBus) {
        await this.eventBus.publish(
          'system.alert.critical',
          {
            message: 'CRITICAL: Cache failure detected. System fell back to in-memory cache.',
            error: errorMessage,
          },
          'LOCAL',
        );
      }

      // Fallback to memory cache (createCache with no args = memory)
      try {
        this.cache = createCache();
        return ok(undefined);
      } catch {
        return err(new AppError('shared.cache_init_failed', { originalError: errorMessage }));
      }
    }
  }

  async get<T>(key: string): AsyncResult<T | undefined | null> {
    try {
      if (!this.cache) return err(new AppError('shared.cache_not_initialized'));
      const value = await this.cache.get<T>(key);
      return ok(value);
    } catch (e) {
      return err(new AppError('shared.cache_get_failed', e));
    }
  }

  async set<T>(key: string, value: T, ttl?: number): AsyncResult<void> {
    try {
      if (!this.cache) return err(new AppError('shared.cache_not_initialized'));
      await this.cache.set(key, value, ttl);
      return ok(undefined);
    } catch (e) {
      return err(new AppError('shared.cache_set_failed', e));
    }
  }

  async del(key: string): AsyncResult<void> {
    try {
      if (!this.cache) return err(new AppError('shared.cache_not_initialized'));
      await this.cache.del(key);
      return ok(undefined);
    } catch (e) {
      return err(new AppError('shared.cache_del_failed', e));
    }
  }

  async reset(): AsyncResult<void> {
    try {
      if (!this.cache) return err(new AppError('shared.cache_not_initialized'));
      await this.cache.clear();
      return ok(undefined);
    } catch (e) {
      return err(new AppError('shared.cache_reset_failed', e));
    }
  }
}
