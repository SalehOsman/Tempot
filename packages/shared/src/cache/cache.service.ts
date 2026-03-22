import { createCache, Cache } from 'cache-manager';
import { ok, err } from 'neverthrow';
import { AsyncResult } from '../result';
import { AppError } from '../errors';

/**
 * Unified Cache Service wrapper around cache-manager
 * Rule: XIX (Cache via cache-manager ONLY), XXI (Result Pattern)
 */
export class CacheService {
  private cache?: Cache;

  constructor() {}

  /**
   * Initialize the cache store
   */
  async init(): Promise<void> {
    // Default to memory store
    this.cache = createCache();
  }

  async get<T>(key: string): AsyncResult<T | undefined> {
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
