import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ok } from 'neverthrow';
import type { CacheService } from '@tempot/shared';
import { TestDB } from '@tempot/database/testing';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { SettingsRepository } from '../../src/settings.repository.js';
import { DynamicSettingsService } from '../../src/dynamic-settings.service.js';
import { MaintenanceService } from '../../src/maintenance.service.js';
import type { SettingsEventBus, SettingsLogger, StaticSettings } from '../../src/settings.types.js';
import { DYNAMIC_SETTING_DEFAULTS } from '../../src/settings.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createInMemoryCache(): CacheService {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => ok(store.get(key) ?? undefined)),
    set: vi.fn(async (key: string, val: string) => {
      store.set(key, val);
      return ok(undefined);
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return ok(undefined);
    }),
    reset: vi.fn(async () => {
      store.clear();
      return ok(undefined);
    }),
    init: vi.fn(async () => ok(undefined)),
  } as unknown as CacheService;
}

function createMockEventBus(): SettingsEventBus {
  return { publish: vi.fn(async () => ok(undefined)) } as unknown as SettingsEventBus;
}

function createMockLogger(): SettingsLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

const staticSettings: StaticSettings = {
  botToken: 'test-token',
  databaseUrl: 'postgresql://localhost/test',
  superAdminIds: [111, 222],
  defaultLanguage: 'ar',
  defaultCountry: 'EG',
};

describe('Settings Integration', () => {
  const testDb = new TestDB();
  let service: DynamicSettingsService;
  let maintenance: MaintenanceService;

  beforeAll(async () => {
    await testDb.start();
    execSync('pnpm prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      cwd: path.resolve(__dirname, '../../../../packages/database'),
    });

    const repo = new SettingsRepository(testDb.prisma);
    const cache = createInMemoryCache();
    const eventBus = createMockEventBus();
    const logger = createMockLogger();
    service = new DynamicSettingsService({ repository: repo, cache, eventBus, logger });
    maintenance = new MaintenanceService(service, staticSettings);
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should return default when no setting exists', async () => {
    const result = await service.get('join_mode');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(DYNAMIC_SETTING_DEFAULTS['join_mode']);
    }
  });

  it('should set and get a dynamic setting', async () => {
    const setResult = await service.set('join_mode', 'CLOSED', 'admin');
    expect(setResult.isOk()).toBe(true);

    const getResult = await service.get('join_mode');
    expect(getResult.isOk()).toBe(true);
    if (getResult.isOk()) {
      expect(getResult.value).toBe('CLOSED');
    }
  });

  it('should update an existing setting', async () => {
    await service.set('join_mode', 'REQUEST', 'admin');
    const result = await service.get('join_mode');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe('REQUEST');
    }
  });

  it('should delete and revert to default', async () => {
    await service.delete('join_mode', 'admin');
    const result = await service.get('join_mode');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(DYNAMIC_SETTING_DEFAULTS['join_mode']);
    }
  });

  it('should toggle maintenance mode', async () => {
    await service.set('maintenance_mode', true, 'admin');
    const status = await maintenance.getStatus();
    expect(status.isOk()).toBe(true);
    if (status.isOk()) {
      expect(status.value.enabled).toBe(true);
      expect(status.value.isSuperAdmin(111)).toBe(true);
      expect(status.value.isSuperAdmin(999)).toBe(false);
    }

    await service.set('maintenance_mode', false, 'admin');
    const status2 = await maintenance.getStatus();
    expect(status2.isOk()).toBe(true);
    if (status2.isOk()) {
      expect(status2.value.enabled).toBe(false);
    }
  });
});
