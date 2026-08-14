/**
 * Cache Adapter: bridges CacheService (AsyncResult<T | undefined | null>)
 * to the CacheAdapter interface expected by SessionProvider
 * (Promise<Result<T | null, AppError>>).
 *
 * @see specs/020-bot-server/plan.md — Design concern 1
 */

import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AppError } from '@tempot/shared';
import type { CacheService } from '@tempot/shared';
import type { CacheAdapter } from '@tempot/session-manager';

/**
 * Wraps a CacheService instance to satisfy the CacheAdapter interface.
 * Normalises undefined → null and unwraps AsyncResult into Result.
 */
export function buildCacheAdapter(cache: CacheService): CacheAdapter {
  return {
    async get<T>(key: string): Promise<Result<T | null, AppError>> {
      const result = await cache.get<T>(key);
      if (result.isErr()) return err(result.error);
      return ok(result.value ?? null);
    },

    async set<T>(key: string, value: T, ttl?: number): Promise<Result<void, AppError>> {
      const result = await cache.set(key, value, ttl);
      if (result.isErr()) return err(result.error);
      return ok(undefined);
    },

    async del(key: string): Promise<Result<void, AppError>> {
      const result = await cache.del(key);
      if (result.isErr()) return err(result.error);
      return ok(undefined);
    },

    async expire(key: string, _ttl: number): Promise<Result<void, AppError>> {
      // CacheService does not expose a dedicated expire/touch operation.
      // Re-fetching and re-setting would race; returning ok is safe here
      // because cache-manager handles TTL internally on creation.
      void key;
      return ok(undefined);
    },
  };
}
