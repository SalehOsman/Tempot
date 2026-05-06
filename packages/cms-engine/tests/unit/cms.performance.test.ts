import { performance } from 'node:perf_hooks';
import { ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import { CmsResolutionService } from '../../src/index.js';

describe('CMS cached resolution performance', () => {
  it('should resolve cached override values below the package latency target', async () => {
    const service = new CmsResolutionService({
      cache: {
        get: vi.fn(async () => ok('Cached {{name}}')),
        set: vi.fn(async () => ok(undefined)),
        delete: vi.fn(async () => ok(undefined)),
      },
      store: {
        findOverride: vi.fn(async () => ok(undefined)),
        upsertOverride: vi.fn(async (override) => ok(override)),
      },
      staticCatalog: {
        findStatic: vi.fn(async () => ok(undefined)),
      },
      dynamicCmsEnabled: true,
    });

    const startedAt = performance.now();
    for (let index = 0; index < 100; index += 1) {
      const result = await service.resolve({ namespace: 'common', key: 'welcome', locale: 'ar' });
      expect(result.isOk()).toBe(true);
    }
    const averageMs = (performance.now() - startedAt) / 100;

    expect(averageMs).toBeLessThan(2);
  });
});
