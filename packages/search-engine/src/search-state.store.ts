import { AppError } from '@tempot/shared';
import type { AsyncResult, Result } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { SEARCH_ENGINE_ERRORS } from './search-engine.errors.js';
import { searchEngineToggle } from './search-engine.toggle.js';
import type { SearchCachePort } from './search-engine.ports.js';
import type { SearchStateSnapshot } from './search-engine.types.js';

export const SEARCH_STATE_TTL_SECONDS = 1800;

export class SearchStateStore {
  constructor(private readonly cache: SearchCachePort) {}

  async save(snapshot: SearchStateSnapshot): AsyncResult<void> {
    const disabled = searchEngineToggle.check();
    if (disabled) return disabled;

    const saved = await this.cache.set(
      stateKey(snapshot.ownerId, snapshot.stateId),
      JSON.stringify(snapshot),
      SEARCH_STATE_TTL_SECONDS,
    );
    if (saved.isErr()) return err(new AppError(SEARCH_ENGINE_ERRORS.STATE_PERSIST_FAILED));
    return ok(undefined);
  }

  async load(ownerId: string, stateId: string): AsyncResult<SearchStateSnapshot> {
    const disabled = searchEngineToggle.check();
    if (disabled) return disabled;

    const stored = await this.cache.get(stateKey(ownerId, stateId));
    if (stored.isErr()) return err(new AppError(SEARCH_ENGINE_ERRORS.STATE_READ_FAILED));
    if (!stored.value) return err(new AppError(SEARCH_ENGINE_ERRORS.STATE_EXPIRED));
    return parseSnapshot(stored.value);
  }
}

function stateKey(ownerId: string, stateId: string): string {
  return `search-engine:state:${ownerId}:${stateId}`;
}

function parseSnapshot(value: string): Result<SearchStateSnapshot> {
  try {
    return ok(JSON.parse(value) as SearchStateSnapshot);
  } catch {
    return err(new AppError(SEARCH_ENGINE_ERRORS.STATE_READ_FAILED));
  }
}
