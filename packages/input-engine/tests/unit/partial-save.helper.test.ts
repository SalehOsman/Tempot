import { describe, it, expect, vi } from 'vitest';
import type { InputEngineLogger } from '../../src/input-engine.contracts.js';
import type { ConversationsStorageAdapter } from '../../src/storage/conversations-storage.adapter.js';
import {
  buildStorageKey,
  restorePartialSave,
  saveFieldProgress,
  maybeSaveProgress,
  deletePartialSave,
  type PartialSaveData,
} from '../../src/runner/partial-save.helper.js';

function createMockLogger(): InputEngineLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function createMockAdapter(
  overrides?: Partial<ConversationsStorageAdapter>,
): ConversationsStorageAdapter {
  return {
    read: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ConversationsStorageAdapter;
}

describe('buildStorageKey', () => {
  it('returns correctly formatted key', () => {
    expect(buildStorageKey(123, 'my-form')).toBe('ie:form:123:my-form');
  });
});

describe('restorePartialSave', () => {
  it('returns saved data when valid shape is found', async () => {
    const saved: PartialSaveData = {
      formData: { name: 'Alice' },
      fieldsCompleted: 1,
      completedFieldNames: ['name'],
    };
    const adapter = createMockAdapter({ read: vi.fn().mockResolvedValue(saved) });
    const logger = createMockLogger();

    const result = await restorePartialSave({ storageAdapter: adapter, logger }, 'key');
    expect(result).toEqual(saved);
  });

  it('returns undefined when no data exists', async () => {
    const adapter = createMockAdapter({ read: vi.fn().mockResolvedValue(undefined) });
    const logger = createMockLogger();

    const result = await restorePartialSave({ storageAdapter: adapter, logger }, 'key');
    expect(result).toBeUndefined();
  });

  it('returns undefined when data has invalid shape', async () => {
    const adapter = createMockAdapter({ read: vi.fn().mockResolvedValue({ bad: true }) });
    const logger = createMockLogger();

    const result = await restorePartialSave({ storageAdapter: adapter, logger }, 'key');
    expect(result).toBeUndefined();
  });

  it('returns undefined and logs warning when storageAdapter.read throws', async () => {
    const adapter = createMockAdapter({
      read: vi.fn().mockRejectedValue(new Error('connection lost')),
    });
    const logger = createMockLogger();

    const result = await restorePartialSave({ storageAdapter: adapter, logger }, 'key');
    expect(result).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('restore') }),
    );
  });
});

describe('saveFieldProgress', () => {
  it('calls storageAdapter.write with the data', async () => {
    const adapter = createMockAdapter();
    const logger = createMockLogger();
    const data: PartialSaveData = {
      formData: { name: 'Bob' },
      fieldsCompleted: 1,
      completedFieldNames: ['name'],
    };

    await saveFieldProgress({ storageAdapter: adapter, logger }, 'key', data);
    expect(adapter.write).toHaveBeenCalledWith('key', data);
  });

  it('does not throw when storageAdapter.write throws; logs warning', async () => {
    const adapter = createMockAdapter({
      write: vi.fn().mockRejectedValue(new Error('write failed')),
    });
    const logger = createMockLogger();
    const data: PartialSaveData = {
      formData: {},
      fieldsCompleted: 0,
      completedFieldNames: [],
    };

    await expect(
      saveFieldProgress({ storageAdapter: adapter, logger }, 'key', data),
    ).resolves.not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('save') }),
    );
  });
});

describe('deletePartialSave', () => {
  it('calls storageAdapter.delete', async () => {
    const adapter = createMockAdapter();
    const logger = createMockLogger();

    await deletePartialSave({ storageAdapter: adapter, logger }, 'key');
    expect(adapter.delete).toHaveBeenCalledWith('key');
  });

  it('does not throw when storageAdapter.delete throws; logs warning', async () => {
    const adapter = createMockAdapter({
      delete: vi.fn().mockRejectedValue(new Error('delete failed')),
    });
    const logger = createMockLogger();

    await expect(
      deletePartialSave({ storageAdapter: adapter, logger }, 'key'),
    ).resolves.not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('delete') }),
    );
  });
});

describe('maybeSaveProgress', () => {
  it('does nothing when partialSaveEnabled is false', async () => {
    const logger = createMockLogger();

    await maybeSaveProgress(
      { logger },
      {
        partialSaveEnabled: false,
        storageKey: 'key',
        formData: {},
        fieldsCompleted: 0,
        completedFieldNames: [],
      },
    );

    // No error, no call — just returns
  });

  it('saves progress when enabled and adapter is available', async () => {
    const adapter = createMockAdapter();
    const logger = createMockLogger();

    await maybeSaveProgress(
      { storageAdapter: adapter, logger },
      {
        partialSaveEnabled: true,
        storageKey: 'key',
        formData: { name: 'test' },
        fieldsCompleted: 1,
        completedFieldNames: ['name'],
      },
    );

    expect(adapter.write).toHaveBeenCalledWith(
      'key',
      expect.objectContaining({
        formData: { name: 'test' },
        fieldsCompleted: 1,
        completedFieldNames: ['name'],
      }),
    );
  });

  it('does not throw when underlying save fails', async () => {
    const adapter = createMockAdapter({
      write: vi.fn().mockRejectedValue(new Error('write failed')),
    });
    const logger = createMockLogger();

    await expect(
      maybeSaveProgress(
        { storageAdapter: adapter, logger },
        {
          partialSaveEnabled: true,
          storageKey: 'key',
          formData: {},
          fieldsCompleted: 0,
          completedFieldNames: [],
        },
      ),
    ).resolves.not.toThrow();
  });
});
