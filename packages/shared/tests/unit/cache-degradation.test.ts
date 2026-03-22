import { describe, it, expect, vi } from 'vitest';
import { CacheService, EventBus } from '../../src/cache/cache.service';

describe('Cache Degradation', () => {
  it('should notify SUPER_ADMIN when cache initialization fails', async () => {
    const mockEventBus: EventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const cacheService = new CacheService(mockEventBus);
    await cacheService.init(true); // simulate failure

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

    const cacheService = new CacheService(mockEventBus);
    await cacheService.init(true);

    await cacheService.set('fallback-key', 'works');
    const res = await cacheService.get('fallback-key');
    expect(res._unsafeUnwrap()).toBe('works');
  });
});
