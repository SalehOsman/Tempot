import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cacheManager from 'cache-manager';
import { CacheService, EventBus } from '../../src/cache/cache.service';

vi.mock('cache-manager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cache-manager')>();
  return {
    ...actual,
    createCache: vi.fn((...args: Parameters<typeof actual.createCache>) => {
      return actual.createCache(...args);
    }),
  };
});

const mockedCreateCache = vi.mocked(cacheManager.createCache);

describe('Cache Degradation', () => {
  beforeEach(() => {
    mockedCreateCache.mockReset();
    // Restore default behavior: delegate to real implementation
    mockedCreateCache.mockImplementation((..._args) => {
      // Return a real in-memory cache
      return cacheManager.createCache();
    });
  });

  it('should notify via event bus when cache initialization fails and return ok (fallback)', async () => {
    const mockEventBus: EventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    // First call throws (simulating Redis failure), second call succeeds (fallback to memory)
    let callCount = 0;
    mockedCreateCache.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Simulated Redis failure');
      }
      // Second call: return a real in-memory cache using cache-manager internals
      // We need to call the real function, but we can't because we mocked it.
      // Instead, use the fact that createCache() with no args = memory store
      // by restoring temporarily. But that's recursive.
      // Simplest: inline a minimal cache for testing.
      const store = new Map<string, unknown>();
      return {
        get: async <T>(key: string) => (store.get(key) as T) ?? null,
        set: async (key: string, value: unknown) => {
          store.set(key, value);
        },
        del: async (key: string) => {
          store.delete(key);
        },
        clear: async () => {
          store.clear();
        },
      } as cacheManager.Cache;
    });

    const cacheService = new CacheService(mockEventBus);
    // Pass stores to exercise primary→fallback path
    const result = await cacheService.init({
      stores: [{} as never],
    });

    // init() returns ok because fallback to memory works
    expect(result.isOk()).toBe(true);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'system.alert.critical',
      expect.objectContaining({
        message: expect.stringContaining('CRITICAL'),
      }),
      'LOCAL',
    );
  });

  it('should fall back to functional memory cache on failure', async () => {
    const mockEventBus: EventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    let callCount = 0;
    const store = new Map<string, unknown>();
    mockedCreateCache.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Simulated Redis failure');
      }
      return {
        get: async <T>(key: string) => (store.get(key) as T) ?? null,
        set: async (key: string, value: unknown) => {
          store.set(key, value);
        },
        del: async (key: string) => {
          store.delete(key);
        },
        clear: async () => {
          store.clear();
        },
      } as cacheManager.Cache;
    });

    const cacheService = new CacheService(mockEventBus);
    // Pass stores to exercise primary→fallback path
    await cacheService.init({ stores: [{} as never] });

    const setResult = await cacheService.set('fallback-key', 'works');
    expect(setResult.isOk()).toBe(true);

    const res = await cacheService.get('fallback-key');
    expect(res._unsafeUnwrap()).toBe('works');
  });
});
