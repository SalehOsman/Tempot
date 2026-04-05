import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { CacheService } from '@tempot/shared';
import { DynamicSettingsService } from '../../src/dynamic-settings.service.js';
import type { SettingsEventBus, SettingsLogger } from '../../src/settings.types.js';
import type { SettingsRepositoryPort } from '../../src/settings.repository.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';
import { DYNAMIC_SETTING_DEFAULTS } from '../../src/settings.types.js';
import type { DynamicSettingRecord } from '../../src/settings.types.js';

function createMockRecord(
  key: string,
  value: string,
  overrides?: Partial<DynamicSettingRecord>,
): DynamicSettingRecord {
  return {
    key,
    value,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

function createMockRepository(): SettingsRepositoryPort {
  return {
    findByKey: vi.fn().mockResolvedValue(ok(null)),
    findAll: vi.fn().mockResolvedValue(ok([])),
    upsert: vi.fn().mockResolvedValue(ok(createMockRecord('test', '"test"'))),
    deleteByKey: vi.fn().mockResolvedValue(ok(createMockRecord('test', '"test"'))),
  };
}

function createMockCache(): CacheService {
  return {
    get: vi.fn().mockResolvedValue(ok(undefined)),
    set: vi.fn().mockResolvedValue(ok(undefined)),
    del: vi.fn().mockResolvedValue(ok(undefined)),
    reset: vi.fn().mockResolvedValue(ok(undefined)),
    init: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as CacheService;
}

function createMockEventBus(): SettingsEventBus {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockLogger(): SettingsLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('DynamicSettingsService', () => {
  let service: DynamicSettingsService;
  let repository: SettingsRepositoryPort;
  let cache: CacheService;
  let eventBus: SettingsEventBus;
  let logger: SettingsLogger;

  beforeEach(() => {
    repository = createMockRepository();
    cache = createMockCache();
    eventBus = createMockEventBus();
    logger = createMockLogger();
    service = new DynamicSettingsService({ repository, cache, eventBus, logger });
  });

  describe('get()', () => {
    it('should return cached value on cache hit without calling DB', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok('"CLOSED"'));

      const result = await service.get('join_mode');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('CLOSED');
      }
      expect(cache.get).toHaveBeenCalledWith('settings:join_mode');
      expect(repository.findByKey).not.toHaveBeenCalled();
    });

    it('should fall through to DB on cache miss and populate cache', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok(undefined));
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '"CLOSED"')),
      );

      const result = await service.get('join_mode');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('CLOSED');
      }
      expect(repository.findByKey).toHaveBeenCalledWith('join_mode');
      expect(cache.set).toHaveBeenCalledWith('settings:join_mode', '"CLOSED"', 300_000);
    });

    it('should return default when cache miss and DB returns null', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok(undefined));
      vi.mocked(repository.findByKey).mockResolvedValue(ok(null));

      const result = await service.get('join_mode');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(DYNAMIC_SETTING_DEFAULTS['join_mode']);
      }
    });

    it('should fall through to DB when cache fails (NFR-005)', async () => {
      vi.mocked(cache.get).mockResolvedValue(err(new AppError('shared.cache_get_failed')));
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '"REQUEST"')),
      );

      const result = await service.get('join_mode');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('REQUEST');
      }
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'join_mode',
          message: expect.stringContaining('Cache read failed'),
        }),
      );
    });

    it('should return default when DB fails (NFR-004)', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok(undefined));
      vi.mocked(repository.findByKey).mockResolvedValue(
        err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR)),
      );

      const result = await service.get('join_mode');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(DYNAMIC_SETTING_DEFAULTS['join_mode']);
      }
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'join_mode',
          message: expect.stringContaining('DB read failed'),
        }),
      );
    });

    it('should return error for unknown key', async () => {
      // Cast to bypass type check — simulating runtime unknown key
      const result = await service.get('nonexistent_key' as unknown as 'join_mode');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY);
      }
    });

    it('should return error when cached value is corrupted JSON', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok('{corrupted'));

      const result = await service.get('join_mode');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.DYNAMIC_PARSE_FAILED);
      }
    });

    it('should return error when DB value is corrupted JSON', async () => {
      vi.mocked(cache.get).mockResolvedValue(ok(undefined));
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '{corrupted')),
      );

      const result = await service.get('join_mode');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.DYNAMIC_PARSE_FAILED);
      }
    });
  });

  describe('set()', () => {
    it('should upsert DB, invalidate cache, and emit settings.setting.updated for existing key', async () => {
      // Key already exists in DB
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '"AUTO"')),
      );
      vi.mocked(repository.upsert).mockResolvedValue(ok(createMockRecord('join_mode', '"CLOSED"')));

      const result = await service.set('join_mode', 'CLOSED', 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(repository.upsert).toHaveBeenCalledWith('join_mode', '"CLOSED"', 'admin-1');
      expect(cache.del).toHaveBeenCalledWith('settings:join_mode');
      expect(eventBus.publish).toHaveBeenCalledWith('settings.setting.updated', {
        key: 'join_mode',
        oldValue: 'AUTO',
        newValue: 'CLOSED',
        changedBy: 'admin-1',
      });
    });

    it('should emit settings.setting.created for new key', async () => {
      // Key does not exist in DB
      vi.mocked(repository.findByKey).mockResolvedValue(ok(null));
      vi.mocked(repository.upsert).mockResolvedValue(ok(createMockRecord('join_mode', '"CLOSED"')));

      const result = await service.set('join_mode', 'CLOSED', 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('settings.setting.created', {
        key: 'join_mode',
        oldValue: DYNAMIC_SETTING_DEFAULTS['join_mode'],
        newValue: 'CLOSED',
        changedBy: 'admin-1',
      });
    });

    it('should additionally emit settings.maintenance.toggled when setting maintenance_mode', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(ok(null));
      vi.mocked(repository.upsert).mockResolvedValue(
        ok(createMockRecord('maintenance_mode', 'true')),
      );

      const result = await service.set('maintenance_mode', true, 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('settings.maintenance.toggled', {
        enabled: true,
        changedBy: 'admin-1',
      });
    });

    it('should return error when existing DB value is corrupted JSON', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '{corrupted')),
      );

      const result = await service.set('join_mode', 'CLOSED', 'admin-1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.DYNAMIC_PARSE_FAILED);
      }
    });
  });

  describe('delete()', () => {
    it('should delete from DB, invalidate cache, and emit settings.setting.deleted', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '"CLOSED"')),
      );
      vi.mocked(repository.deleteByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '"CLOSED"')),
      );

      const result = await service.delete('join_mode', 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(repository.deleteByKey).toHaveBeenCalledWith('join_mode');
      expect(cache.del).toHaveBeenCalledWith('settings:join_mode');
      expect(eventBus.publish).toHaveBeenCalledWith('settings.setting.deleted', {
        key: 'join_mode',
        oldValue: 'CLOSED',
        newValue: DYNAMIC_SETTING_DEFAULTS['join_mode'],
        changedBy: 'admin-1',
      });
    });

    it('should emit settings.maintenance.toggled when deleting maintenance_mode', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('maintenance_mode', 'true')),
      );
      vi.mocked(repository.deleteByKey).mockResolvedValue(
        ok(createMockRecord('maintenance_mode', 'true')),
      );

      const result = await service.delete('maintenance_mode', 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('settings.maintenance.toggled', {
        enabled: false,
        changedBy: 'admin-1',
      });
    });

    it('should return error when existing DB value is corrupted JSON on delete', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(
        ok(createMockRecord('join_mode', '{corrupted')),
      );

      const result = await service.delete('join_mode', 'admin-1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.DYNAMIC_PARSE_FAILED);
      }
    });
  });

  describe('event emission failure', () => {
    it('should not fail the write operation when event emission fails', async () => {
      vi.mocked(repository.findByKey).mockResolvedValue(ok(null));
      vi.mocked(repository.upsert).mockResolvedValue(ok(createMockRecord('join_mode', '"CLOSED"')));
      vi.mocked(eventBus.publish).mockResolvedValue(err(new AppError('event.publish_failed')));

      const result = await service.set('join_mode', 'CLOSED', 'admin-1');

      expect(result.isOk()).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'settings.setting.created',
          message: expect.stringContaining('Event emission failed'),
        }),
      );
    });
  });
});
