import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { buildCacheAdapter } from '../../src/startup/cache.adapter.js';

function makeCache(
  overrides: Partial<{
    get: () => Promise<unknown>;
    set: () => Promise<unknown>;
    del: () => Promise<unknown>;
  }> = {},
) {
  return {
    get: vi.fn().mockResolvedValue(ok('cached-value')),
    set: vi.fn().mockResolvedValue(ok(undefined)),
    del: vi.fn().mockResolvedValue(ok(undefined)),
    reset: vi.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  };
}

describe('buildCacheAdapter', () => {
  let cache: ReturnType<typeof makeCache>;

  beforeEach(() => {
    cache = makeCache();
  });

  describe('get()', () => {
    it('returns ok(value) when CacheService.get succeeds with a value', async () => {
      cache.get.mockResolvedValue(ok('hello'));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.get<string>('key:1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello');
    });

    it('normalises undefined to null', async () => {
      cache.get.mockResolvedValue(ok(undefined));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.get<string>('key:1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('normalises null to null', async () => {
      cache.get.mockResolvedValue(ok(null));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.get<string>('key:1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('returns err when CacheService.get fails', async () => {
      const error = new AppError('shared.cache_get_failed');
      cache.get.mockResolvedValue(err(error));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.get<string>('key:1');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('shared.cache_get_failed');
    });
  });

  describe('set()', () => {
    it('returns ok(undefined) when CacheService.set succeeds', async () => {
      cache.set.mockResolvedValue(ok(undefined));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.set('key:1', { foo: 'bar' }, 300);

      expect(result.isOk()).toBe(true);
    });

    it('forwards ttl to CacheService.set', async () => {
      const adapter = buildCacheAdapter(cache as never);
      await adapter.set('key:2', 'value', 600);

      expect(cache.set).toHaveBeenCalledWith('key:2', 'value', 600);
    });

    it('returns err when CacheService.set fails', async () => {
      const error = new AppError('shared.cache_set_failed');
      cache.set.mockResolvedValue(err(error));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.set('key:1', 'val');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('del()', () => {
    it('returns ok(undefined) when CacheService.del succeeds', async () => {
      const adapter = buildCacheAdapter(cache as never);
      const result = await adapter.del('key:1');

      expect(result.isOk()).toBe(true);
    });

    it('returns err when CacheService.del fails', async () => {
      const error = new AppError('shared.cache_del_failed');
      cache.del.mockResolvedValue(err(error));
      const adapter = buildCacheAdapter(cache as never);

      const result = await adapter.del('key:1');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('expire()', () => {
    it('always returns ok (no-op shim)', async () => {
      const adapter = buildCacheAdapter(cache as never);
      const result = await adapter.expire('key:1', 60);

      expect(result.isOk()).toBe(true);
    });
  });
});
