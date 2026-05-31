import { describe, it, expect } from 'vitest';
import {
  DYNAMIC_SETTING_DEFAULTS,
  type DynamicSettingDefinitions,
} from '../../src/settings.types.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';

describe('Settings Type Definitions', () => {
  it('should export DYNAMIC_SETTING_DEFAULTS with all 7 known keys', () => {
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('join_mode', 'AUTO');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('maintenance_mode', false);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('approval_role', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('backup_schedule', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('log_retention_days', 90);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('dynamic_default_language', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('notifications_enabled', true);
  });

  it('should have exactly 7 dynamic setting keys', () => {
    expect(Object.keys(DYNAMIC_SETTING_DEFAULTS)).toHaveLength(7);
  });

  it('should enforce type safety — defaults match DynamicSettingDefinitions', () => {
    // Type-level test: if this compiles, the mapped type is correct
    const joinMode: DynamicSettingDefinitions['join_mode'] = DYNAMIC_SETTING_DEFAULTS.join_mode;
    const maintenanceMode: DynamicSettingDefinitions['maintenance_mode'] =
      DYNAMIC_SETTING_DEFAULTS.maintenance_mode;
    const logRetention: DynamicSettingDefinitions['log_retention_days'] =
      DYNAMIC_SETTING_DEFAULTS.log_retention_days;
    const notificationsEnabled: DynamicSettingDefinitions['notifications_enabled'] =
      DYNAMIC_SETTING_DEFAULTS.notifications_enabled;
    expect(joinMode).toBe('AUTO');
    expect(maintenanceMode).toBe(false);
    expect(logRetention).toBe(90);
    expect(notificationsEnabled).toBe(true);
  });
});

describe('Settings Error Codes', () => {
  it('should export hierarchical error codes', () => {
    expect(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED).toBe('settings.static.validation_failed');
    expect(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY).toBe('settings.dynamic.unknown_key');
    expect(SETTINGS_ERRORS.REPOSITORY_ERROR).toBe('settings.repository.error');
    expect(SETTINGS_ERRORS.CACHE_INVALIDATION_FAILED).toBe('settings.cache.invalidation_failed');
  });

  it('should have all expected error codes', () => {
    const codes = Object.values(SETTINGS_ERRORS);
    expect(codes.length).toBeGreaterThanOrEqual(10);
    // All codes follow settings.{category}.{detail} pattern
    for (const code of codes) {
      expect(code).toMatch(/^settings\.\w+\.\w+$/);
    }
  });
});
