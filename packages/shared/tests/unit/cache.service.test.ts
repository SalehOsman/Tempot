import { describe, it, expect, beforeEach } from 'vitest';
import { CacheService, EventBus } from '../../src/cache/cache.service';
import { ok } from 'neverthrow';

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
});
