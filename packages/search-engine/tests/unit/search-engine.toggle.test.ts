import { afterEach, describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import { searchEngineToggle, SearchPlanBuilder, SearchStateStore } from '../../src/index.js';
import type { SearchCachePort, SearchRequest, SearchStateSnapshot } from '../../src/index.js';

const request: SearchRequest = {
  requestId: 'search-1',
  mode: 'exact',
  filters: [],
  sort: [],
  pagination: { page: 1, pageSize: 10 },
  allowedFields: [],
};

const snapshot: SearchStateSnapshot = {
  stateId: 'state-1',
  ownerId: 'user-1',
  expiresInSeconds: 1800,
  request,
};

const cache: SearchCachePort = {
  set: async () => ok(undefined),
  get: async () => ok(JSON.stringify(snapshot)),
};

describe('searchEngineToggle', () => {
  afterEach(() => {
    delete process.env.TEMPOT_SEARCH_ENGINE;
  });

  it('should default to enabled when env var is not set', () => {
    expect(searchEngineToggle.isEnabled()).toBe(true);
    expect(searchEngineToggle.envVar).toBe('TEMPOT_SEARCH_ENGINE');
    expect(searchEngineToggle.packageName).toBe('search-engine');
  });

  it('should block search plan building when disabled', async () => {
    process.env.TEMPOT_SEARCH_ENGINE = 'false';

    const result = await new SearchPlanBuilder().build(request);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe('search-engine.disabled');
  });

  it('should block search state persistence when disabled', async () => {
    process.env.TEMPOT_SEARCH_ENGINE = 'false';

    const result = await new SearchStateStore(cache).save(snapshot);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe('search-engine.disabled');
  });
});
