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
  value: 'Current {{name}}',
  previousValue: 'Previous {{name}}',
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

function createEvents(): CmsEventPublisherPort {
  return { publishTranslationUpdated: vi.fn(async () => ok(undefined)) };
}

function createAudit(): CmsAuditPort {
  return { recordTranslationMutation: vi.fn(async () => ok(undefined)) };
}

function createStaticCatalog(): CmsStaticCatalogPort {
  return { findStatic: vi.fn(async () => ok(staticEntry)) };
}

describe('CmsUpdateService rollback', () => {
  it('should roll back to previous override value through the normal update path', async () => {
    const store: CmsOverrideStorePort = {
      findOverride: vi.fn(async () => ok(overrideEntry)),
      upsertOverride: vi.fn(async (override) => ok(override)),
    };
    const result = await new CmsUpdateService({
      cache: createCache(),
      store,
      staticCatalog: createStaticCatalog(),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).rollbackToPrevious({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      updatedBy: 'admin-2',
      reason: 'cms.rollback.previous',
    });

    expect(result.isOk()).toBe(true);
    expect(store.upsertOverride).toHaveBeenCalledWith({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: 'Previous {{name}}',
      previousValue: 'Current {{name}}',
      updatedBy: 'admin-2',
      updatedAt: '2026-05-06T00:00:00.000Z',
      protection: 'editable',
    });
  });

  it('should return a typed error when no previous value is available', async () => {
    const store: CmsOverrideStorePort = {
      findOverride: vi.fn(async () => ok({ ...overrideEntry, previousValue: undefined })),
      upsertOverride: vi.fn(async (override) => ok(override)),
    };
    const result = await new CmsUpdateService({
      cache: createCache(),
      store,
      staticCatalog: createStaticCatalog(),
      events: createEvents(),
      audit: createAudit(),
      dynamicCmsEnabled: true,
      now: () => '2026-05-06T00:00:00.000Z',
    }).rollbackToPrevious({
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      updatedBy: 'admin-2',
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.ROLLBACK_UNAVAILABLE);
  });
});
