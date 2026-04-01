import { createCache, type Cache, type CreateCacheOptions } from 'cache-manager';
import { ok, err } from 'neverthrow';
import { AsyncResult } from '../shared.result.js';
import { AppError } from '../shared.errors.js';

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
 * Configuration for CacheService initialization.
 * Extends cache-manager's CreateCacheOptions so consumers can pass
 * Keyv store instances (e.g. Redis) for the primary cache layer.
 */
export type CacheServiceConfig = CreateCacheOptions;

/**
 * Unified Cache Service wrapper around cache-manager.
 * Rule: XIX (Cache via cache-manager ONLY), XXI (Result Pattern).
 *
 * Init strategy: if `stores` are provided, attempts to create cache
 * with them first (e.g. Redis). On failure, falls back to in-memory
 * cache (no stores) and publishes a SUPER_ADMIN degradation alert.
 */
export class CacheService {
  private cache?: Cache;

  constructor(
    private eventBus?: EventBus,
    private logger?: CacheLogger,
  ) {}

  /**
   * Initialize the cache store.
   * When `config.stores` is provided, tries the external store first.
   * On failure, falls back to memory-only cache and publishes alert.
   */
  async init(config?: CacheServiceConfig): AsyncResult<void> {
    // Primary: try with configured stores (Redis, etc.)
    if (config?.stores?.length) {
      try {
        this.cache = createCache(config);
        return ok(undefined);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return this.fallbackToMemory(errorMessage, config.ttl);
      }
    }

    // No external store configured — use in-memory directly
    try {
      this.cache = createCache({ ttl: config?.ttl });
      return ok(undefined);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return err(new AppError('shared.cache_init_failed', { originalError: errorMessage }));
    }
  }

  /** Fall back to memory-only cache after external store failure. */
  private async fallbackToMemory(errorMessage: string, ttl?: number): AsyncResult<void> {
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

    try {
      this.cache = createCache({ ttl });
      return ok(undefined);
    } catch {
      return err(new AppError('shared.cache_init_failed', { originalError: errorMessage }));
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
