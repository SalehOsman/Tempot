import { ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import { CMS_ENGINE_ERRORS, CmsResolutionService } from '../../src/index.js';
import type {
  CmsAiReviewerPort,
  CmsCachePort,
  CmsOverrideStorePort,
  CmsStaticCatalogPort,
  CmsTranslationOverride,
  CmsTranslationStaticEntry,
} from '../../src/index.js';

const staticEntry: CmsTranslationStaticEntry = {
  namespace: 'common',
  key: 'welcome',
  locale: 'ar',
  value: 'Static {{name}}',
  format: 'plain',
  protection: 'editable',
};

const overrideEntry: CmsTranslationOverride = {
  namespace: 'common',
  key: 'welcome',
  locale: 'ar',
  value: 'Override {{name}}',
  previousValue: 'Static {{name}}',
  updatedBy: 'admin-1',
  updatedAt: '2026-05-06T00:00:00.000Z',
  protection: 'editable',
};

function createCache(value?: string): CmsCachePort {
  return {
    get: vi.fn(async () => ok(value)),
    set: vi.fn(async () => ok(undefined)),
    delete: vi.fn(async () => ok(undefined)),
  };
}

function createStore(value?: CmsTranslationOverride): CmsOverrideStorePort {
  return {
    findOverride: vi.fn(async () => ok(value)),
    upsertOverride: vi.fn(async (override) => ok(override)),
  };
}

function createStaticCatalog(value?: CmsTranslationStaticEntry): CmsStaticCatalogPort {
  return {
    findStatic: vi.fn(async () => ok(value)),
  };
}

describe('CmsResolutionService', () => {
  it('should bypass cache, store, and AI when dynamic CMS is disabled', async () => {
    const cache = createCache('cached');
    const store = createStore(overrideEntry);
    const reviewer: CmsAiReviewerPort = { reviewDraft: vi.fn() };
    const result = await new CmsResolutionService({
      cache,
      store,
      staticCatalog: createStaticCatalog(staticEntry),
      aiReviewer: reviewer,
      dynamicCmsEnabled: false,
    }).resolve({ namespace: 'common', key: 'welcome', locale: 'ar' });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.source).toBe('static');
    expect(result.value.value).toBe('Static {{name}}');
    expect(cache.get).not.toHaveBeenCalled();
    expect(store.findOverride).not.toHaveBeenCalled();
    expect(reviewer.reviewDraft).not.toHaveBeenCalled();
  });

  it('should resolve from cache before store or static fallback when enabled', async () => {
    const cache = createCache('Cached {{name}}');
    const store = createStore(overrideEntry);
    const staticCatalog = createStaticCatalog(staticEntry);
    const result = await new CmsResolutionService({
      cache,
      store,
      staticCatalog,
      dynamicCmsEnabled: true,
    }).resolve({ namespace: 'common', key: 'welcome', locale: 'ar' });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.source).toBe('cache');
    expect(store.findOverride).not.toHaveBeenCalled();
    expect(staticCatalog.findStatic).not.toHaveBeenCalled();
  });

  it('should cache override-store hits before returning them', async () => {
    const cache = createCache();
    const result = await new CmsResolutionService({
      cache,
      store: createStore(overrideEntry),
      staticCatalog: createStaticCatalog(staticEntry),
      dynamicCmsEnabled: true,
    }).resolve({ namespace: 'common', key: 'welcome', locale: 'ar' });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.source).toBe('override');
    expect(cache.set).toHaveBeenCalledWith('cms:ar:common:welcome', 'Override {{name}}', 1800);
  });

  it('should fall back from locale static entry to fallback locale static entry', async () => {
    const fallbackEntry: CmsTranslationStaticEntry = {
      ...staticEntry,
      locale: 'en',
      value: 'Fallback {{name}}',
    };
    const staticCatalog: CmsStaticCatalogPort = {
      findStatic: vi
        .fn()
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(fallbackEntry)),
    };
    const result = await new CmsResolutionService({
      cache: createCache(),
      store: createStore(),
      staticCatalog,
      dynamicCmsEnabled: true,
    }).resolve({ namespace: 'common', key: 'welcome', locale: 'ar', fallbackLocale: 'en' });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.source).toBe('fallback_static');
    expect(result.value.value).toBe('Fallback {{name}}');
  });

  it('should return a typed missing-key error when no source has the key', async () => {
    const result = await new CmsResolutionService({
      cache: createCache(),
      store: createStore(),
      staticCatalog: createStaticCatalog(),
      dynamicCmsEnabled: true,
    }).resolve({ namespace: 'common', key: 'missing', locale: 'ar', fallbackLocale: 'en' });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.MISSING_KEY);
  });
});
