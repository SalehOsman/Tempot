import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  SEARCH_ENGINE_ERRORS,
  SEARCH_STATE_TTL_SECONDS,
  SearchStateStore,
} from '../../src/index.js';
import type { SearchCachePort, SearchStateSnapshot } from '../../src/index.js';

const snapshot: SearchStateSnapshot = {
  stateId: 'state-1',
  ownerId: 'user-1',
  expiresInSeconds: SEARCH_STATE_TTL_SECONDS,
  request: {
    requestId: 'search-1',
    mode: 'exact',
    query: 'invoice',
    filters: [],
    sort: [],
    pagination: { page: 1, pageSize: 10 },
    allowedFields: [],
  },
};

class FakeCache implements SearchCachePort {
  readonly writes: { key: string; value: string; ttlSeconds: number }[] = [];

  constructor(private readonly storedValue?: string) {}

  async set(key: string, value: string, ttlSeconds: number) {
    this.writes.push({ key, value, ttlSeconds });
    return ok(undefined);
  }

  async get() {
    return ok(this.storedValue);
  }
}

describe('SearchStateStore', () => {
  it('should save state snapshots with a namespaced key and fixed TTL', async () => {
    const cache = new FakeCache();
    const result = await new SearchStateStore(cache).save(snapshot);

    expect(result.isOk()).toBe(true);
    expect(cache.writes).toHaveLength(1);
    expect(cache.writes[0]?.key).toBe('search-engine:state:user-1:state-1');
    expect(cache.writes[0]?.ttlSeconds).toBe(1800);
    expect(JSON.parse(cache.writes[0]?.value ?? '{}')).toEqual(snapshot);
  });

  it('should load state snapshots from the namespaced key', async () => {
    const cache = new FakeCache(JSON.stringify(snapshot));
    const result = await new SearchStateStore(cache).load('user-1', 'state-1');

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value).toEqual(snapshot);
  });

  it('should return a typed expired-state error when state is missing or expired', async () => {
    const result = await new SearchStateStore(new FakeCache()).load('user-1', 'state-1');

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.STATE_EXPIRED);
  });

  it('should return a typed read error when cached state payload is invalid', async () => {
    const result = await new SearchStateStore(new FakeCache('{invalid-json')).load(
      'user-1',
      'state-1',
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.STATE_READ_FAILED);
  });
});
