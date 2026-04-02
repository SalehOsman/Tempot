import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService, EventBus, CacheLogger } from '../../src/cache/cache.service';
import { ok, err } from 'neverthrow';
import { AppError } from '../../src/shared.errors';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    cacheService = new CacheService();
    const initResult = await cacheService.init();
    expect(initResult.isOk()).toBe(true);
  });

  it('init() should return ok Result on success', async () => {
    const fresh = new CacheService();
    const result = await fresh.init();
    expect(result.isOk()).toBe(true);
  });

  it('should set and get a value', async () => {
    const setRes = await cacheService.set('test-key', 'test-value');
    expect(setRes.isOk()).toBe(true);

    const getRes = await cacheService.get<string>('test-key');
    expect(getRes.isOk()).toBe(true);
    expect(getRes._unsafeUnwrap()).toBe('test-value');
  });

  it('should delete a value', async () => {
    await cacheService.set('to-delete', 'exists');
    const delRes = await cacheService.del('to-delete');
    expect(delRes.isOk()).toBe(true);

    const getRes = await cacheService.get('to-delete');
    // cache-manager returns null for missing keys
    expect(getRes._unsafeUnwrap()).toBeNull();
  });

  it('should clear the cache', async () => {
    await cacheService.set('k1', 'v1');
    await cacheService.set('k2', 'v2');

    const resetRes = await cacheService.reset();
    expect(resetRes.isOk()).toBe(true);

    const v1 = await cacheService.get('k1');
    const v2 = await cacheService.get('k2');
    expect(v1._unsafeUnwrap()).toBeNull();
    expect(v2._unsafeUnwrap()).toBeNull();
  });

  it('get should return err when cache is not initialized', async () => {
    const uninitService = new CacheService();
    const result = await uninitService.get('key');
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('shared.cache_not_initialized');
    }
  });

  it('set should return err when cache is not initialized', async () => {
    const uninitService = new CacheService();
    const result = await uninitService.set('key', 'value');
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('shared.cache_not_initialized');
    }
  });

  describe('EventBus interface type safety', () => {
    it('should accept typed system.alert.critical payload', () => {
      const bus: EventBus = {
        publish: (_event: string, _payload: unknown) => Promise.resolve(ok(undefined)),
      } as EventBus;

      // Typed overload: exact event name + correct payload shape
      const result = bus.publish('system.alert.critical', {
        message: 'test alert',
        error: 'test error',
      });

      expect(result).toBeInstanceOf(Promise);
    });

    it('should return AsyncResult<void> from publish', async () => {
      const bus: EventBus = {
        publish: (_event: string, _payload: unknown) => Promise.resolve(ok(undefined)),
      } as EventBus;

      const result = await bus.publish('some.event', {});
      // AsyncResult<void> means Result<void, AppError> — should have isOk()
      expect(result.isOk()).toBe(true);
    });
  });

  describe('fallback publish failure handling (Rule X)', () => {
    it('should log warning when eventBus.publish fails during fallback', async () => {
      const mockEventBus: EventBus = {
        publish: vi.fn().mockResolvedValue(err(new AppError('event_bus.publish_failed'))),
      } as unknown as EventBus;
      const mockLogger: CacheLogger = { warn: vi.fn() };

      // Subclass to expose the protected fallbackToMemory for direct testing.
      // createCache never throws in cache-manager v6 (stores are lazy),
      // so the fallback path cannot be triggered via init() in unit tests.
      class TestableCacheService extends CacheService {
        async testFallbackToMemory(errorMessage: string) {
          return (
            this as unknown as { fallbackToMemory: (msg: string) => Promise<unknown> }
          ).fallbackToMemory(errorMessage);
        }
      }

      const service = new TestableCacheService(mockEventBus, mockLogger);
      await service.testFallbackToMemory('Redis connection refused');

      // Assert: logger.warn was called about the publish failure
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('publish'));
    });
  });
});
