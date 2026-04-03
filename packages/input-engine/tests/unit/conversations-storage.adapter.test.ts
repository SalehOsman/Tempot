import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { ConversationsStorageAdapter } from '../../src/storage/conversations-storage.adapter.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMockCache() {
  return {
    get: vi.fn().mockResolvedValue(ok(undefined)),
    set: vi.fn().mockResolvedValue(ok(undefined)),
    del: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockLogger(): InputEngineLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

describe('ConversationsStorageAdapter', () => {
  let adapter: ConversationsStorageAdapter;
  let cache: ReturnType<typeof createMockCache>;
  let logger: InputEngineLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = createMockCache();
    logger = createMockLogger();
    adapter = new ConversationsStorageAdapter(cache as never, logger);
  });

  describe('read', () => {
    it('returns stored value on cache hit', async () => {
      const state = { version: [0, 0], state: { conv1: [] } };
      cache.get.mockResolvedValue(ok(state));
      const result = await adapter.read('chat:123');
      expect(result).toEqual(state);
      expect(cache.get).toHaveBeenCalledWith('chat:123');
    });

    it('returns undefined on cache miss', async () => {
      cache.get.mockResolvedValue(ok(undefined));
      const result = await adapter.read('chat:123');
      expect(result).toBeUndefined();
    });

    it('returns undefined on cache error (graceful degradation)', async () => {
      cache.get.mockResolvedValue(err(new AppError('cache.failed')));
      const result = await adapter.read('chat:123');
      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_RESTORE_FAILED }),
      );
    });
  });

  describe('write', () => {
    it('writes value to cache with TTL', async () => {
      const state = { version: [0, 0], state: {} };
      await adapter.write('chat:123', state);
      expect(cache.set).toHaveBeenCalledWith('chat:123', state, 86_400_000);
    });

    it('logs warning on cache error but does not throw', async () => {
      cache.set.mockResolvedValue(err(new AppError('cache.failed')));
      await expect(adapter.write('chat:123', {})).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes key from cache', async () => {
      await adapter.delete('chat:123');
      expect(cache.del).toHaveBeenCalledWith('chat:123');
    });

    it('logs warning on cache error but does not throw', async () => {
      cache.del.mockResolvedValue(err(new AppError('cache.failed')));
      await expect(adapter.delete('chat:123')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
