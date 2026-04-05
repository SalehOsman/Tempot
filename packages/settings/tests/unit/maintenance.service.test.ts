import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { MaintenanceService } from '../../src/maintenance.service.js';
import type { DynamicSettingsService } from '../../src/dynamic-settings.service.js';
import type { StaticSettings } from '../../src/settings.types.js';

function createMockDynamicService(): { get: ReturnType<typeof vi.fn> } {
  return { get: vi.fn() };
}

const mockStaticSettings: StaticSettings = {
  botToken: 'test-token',
  databaseUrl: 'postgresql://localhost/test',
  superAdminIds: [111, 222],
  defaultLanguage: 'ar',
  defaultCountry: 'EG',
};

describe('MaintenanceService', () => {
  it('should return enabled: false when maintenance_mode is false', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(
      mockDynamic as unknown as DynamicSettingsService,
      mockStaticSettings,
    );

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(false);
    }
  });

  it('should return enabled: true when maintenance_mode is true', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(true));
    const service = new MaintenanceService(
      mockDynamic as unknown as DynamicSettingsService,
      mockStaticSettings,
    );

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(true);
    }
  });

  it('should return isSuperAdmin(111) as true', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(
      mockDynamic as unknown as DynamicSettingsService,
      mockStaticSettings,
    );

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isSuperAdmin(111)).toBe(true);
      expect(result.value.isSuperAdmin(222)).toBe(true);
    }
  });

  it('should return isSuperAdmin(999) as false', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(
      mockDynamic as unknown as DynamicSettingsService,
      mockStaticSettings,
    );

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isSuperAdmin(999)).toBe(false);
    }
  });

  it('should default to enabled: false when maintenance_mode read fails', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(err(new AppError('settings.dynamic.unknown_key')));
    const service = new MaintenanceService(
      mockDynamic as unknown as DynamicSettingsService,
      mockStaticSettings,
    );

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(false);
    }
  });
});
