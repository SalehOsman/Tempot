import { ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import { CMS_ENGINE_ERRORS, CmsUpdateService } from '../../src/index.js';
import type {
  CmsAuditPort,
  CmsCachePort,
  CmsEventPublisherPort,
  CmsOverrideStorePort,
  CmsStaticCatalogPort,
  CmsTranslationOverride,
  CmsTranslationStaticEntry,
} from '../../src/index.js';

const baseStatic: CmsTranslationStaticEntry = {
  namespace: 'common',
  key: 'welcome',
  locale: 'ar',
  value: 'Hello {{name}}',
  format: 'telegram_html',
  protection: 'editable',
};

const savedOverride: CmsTranslationOverride = {
  namespace: 'common',
  key: 'welcome',
  locale: 'ar',
  value: '<b>Hello {{name}}</b>',
  previousValue: 'Hello {{name}}',
  updatedBy: 'admin-1',
  updatedAt: '2026-05-06T00:00:00.000Z',
  protection: 'editable',
};

function createCache(): CmsCachePort {
  return {
    get: vi.fn(async () => ok(undefined)),
    set: vi.fn(async () => ok(undefined)),
    delete: vi.fn(async () => ok(undefined)),
  };
}

function createStore(value: CmsTranslationOverride = savedOverride): CmsOverrideStorePort {
  return {
    findOverride: vi.fn(async () => ok(undefined)),
    upsertOverride: vi.fn(async () => ok(value)),
  };
}

function createStaticCatalog(entry?: CmsTranslationStaticEntry): CmsStaticCatalogPort {
  return {
    findStatic: vi.fn(async () => ok(entry)),
  };
}

function createEvents(): CmsEventPublisherPort {
  return { publishTranslationUpdated: vi.fn(async () => ok(undefined)) };
}

function createAudit(): CmsAuditPort {
  return { recordTranslationMutation: vi.fn(async () => ok(undefined)) };
}

describe('CmsUpdateService', () => {
  it('should reject updates when dynamic CMS is disabled', async () => {
    const result = await new CmsUpdateService({
      cache: createCache(),
      store: createStore(),
      staticCatalog: createStaticCatalog(baseStatic),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: false,
      now: () => '2026-05-06T00:00:00.000Z',
    }).update({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: 'Hello {{name}}',
      updatedBy: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.DISABLED);
  });

  it('should reject updates for static keys that do not exist', async () => {
    const store = createStore();
    const result = await new CmsUpdateService({
      cache: createCache(),
      store,
      staticCatalog: createStaticCatalog(),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).update({
      namespace: 'common',
      key: 'missing',
      locale: 'ar',
      value: 'Hello',
      updatedBy: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.MISSING_KEY);
    expect(store.upsertOverride).not.toHaveBeenCalled();
  });

  it('should reject locked protected keys before writing state', async () => {
    const store = createStore();
    const result = await new CmsUpdateService({
      cache: createCache(),
      store,
      staticCatalog: createStaticCatalog({ ...baseStatic, protection: 'locked' }),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).update({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: 'Hello {{name}}',
      updatedBy: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.PROTECTED_KEY);
    expect(store.upsertOverride).not.toHaveBeenCalled();
  });

  it('should reject values that remove required placeholders', async () => {
    const result = await new CmsUpdateService({
      cache: createCache(),
      store: createStore(),
      staticCatalog: createStaticCatalog(baseStatic),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).update({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: 'Hello',
      updatedBy: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.PLACEHOLDER_MISMATCH);
  });

  it('should sanitize, store, invalidate cache, publish an event, and audit successful updates', async () => {
    const cache = createCache();
    const store = createStore();
    const events = createEvents();
    const audit = createAudit();
    const result = await new CmsUpdateService({
      cache,
      store,
      staticCatalog: createStaticCatalog(baseStatic),
      events,
      audit,
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).update({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: '<script>alert(1)</script><b>Hello {{name}}</b>',
      updatedBy: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(store.upsertOverride).toHaveBeenCalledWith({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: '<b>Hello {{name}}</b>',
      previousValue: 'Hello {{name}}',
      updatedBy: 'admin-1',
      updatedAt: '2026-05-06T00:00:00.000Z',
      protection: 'editable',
    });
    expect(cache.delete).toHaveBeenCalledWith('cms:ar:common:welcome');
    expect(events.publishTranslationUpdated).toHaveBeenCalledWith({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      updatedBy: 'admin-1',
      updatedAt: '2026-05-06T00:00:00.000Z',
    });
    expect(audit.recordTranslationMutation).toHaveBeenCalledWith({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      beforeValue: 'Hello {{name}}',
      afterValue: '<b>Hello {{name}}</b>',
      changedBy: 'admin-1',
      changedAt: '2026-05-06T00:00:00.000Z',
      reason: undefined,
    });
  });
});
