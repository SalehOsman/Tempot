import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { SettingsService } from '../../src/settings.service.js';
import type { DynamicSettingsService } from '../../src/dynamic-settings.service.js';
import type { MaintenanceService } from '../../src/maintenance.service.js';
import type { StaticSettings } from '../../src/settings.types.js';

const mockStatic: StaticSettings = {
  botToken: 'tok',
  databaseUrl: 'pg://localhost/db',
  superAdminIds: [1],
  defaultLanguage: 'ar',
  defaultCountry: 'EG',
};

function createMockDynamic(): DynamicSettingsService {
  return {
    get: vi.fn().mockResolvedValue(ok('AUTO')),
    set: vi.fn().mockResolvedValue(ok(undefined)),
    delete: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as DynamicSettingsService;
}

function createMockMaintenance(): MaintenanceService {
  return {
    getStatus: vi.fn().mockResolvedValue(ok({ enabled: false, isSuperAdmin: () => false })),
  } as unknown as MaintenanceService;
}

describe('SettingsService', () => {
  it('getStatic() should return the static settings result', () => {
    const staticResult = ok(mockStatic);
    const service = new SettingsService(staticResult, createMockDynamic(), createMockMaintenance());

    const result = service.getStatic();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.botToken).toBe('tok');
    }
  });

  it('getStatic() should return error when static loading failed', () => {
    const staticResult = err(new AppError('settings.static.validation_failed'));
    const service = new SettingsService(staticResult, createMockDynamic(), createMockMaintenance());

    const result = service.getStatic();
    expect(result.isErr()).toBe(true);
  });

  it('getDynamic() should delegate to DynamicSettingsService', async () => {
    const mockDynamic = createMockDynamic();
    const service = new SettingsService(ok(mockStatic), mockDynamic, createMockMaintenance());

    await service.getDynamic('join_mode');
    expect(mockDynamic.get).toHaveBeenCalledWith('join_mode');
  });

  it('setDynamic() should delegate to DynamicSettingsService', async () => {
    const mockDynamic = createMockDynamic();
    const service = new SettingsService(ok(mockStatic), mockDynamic, createMockMaintenance());

    await service.setDynamic('join_mode', 'CLOSED', 'admin');
    expect(mockDynamic.set).toHaveBeenCalledWith('join_mode', 'CLOSED', 'admin');
  });

  it('deleteDynamic() should delegate to DynamicSettingsService', async () => {
    const mockDynamic = createMockDynamic();
    const service = new SettingsService(ok(mockStatic), mockDynamic, createMockMaintenance());

    await service.deleteDynamic('join_mode', 'admin');
    expect(mockDynamic.delete).toHaveBeenCalledWith('join_mode', 'admin');
  });

  it('getMaintenanceStatus() should delegate to MaintenanceService', async () => {
    const mockMaint = createMockMaintenance();
    const service = new SettingsService(ok(mockStatic), createMockDynamic(), mockMaint);

    const result = await service.getMaintenanceStatus();
    expect(result.isOk()).toBe(true);
    expect(mockMaint.getStatus).toHaveBeenCalled();
  });
});
