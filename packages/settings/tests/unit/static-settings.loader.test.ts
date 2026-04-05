import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StaticSettingsLoader } from '../../src/static-settings.loader.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';

describe('StaticSettingsLoader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load all required settings when present', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '123,456,789';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.botToken).toBe('test-token');
      expect(result.value.databaseUrl).toBe('postgresql://localhost/test');
      expect(result.value.superAdminIds).toEqual([123, 456, 789]);
      expect(result.value.defaultLanguage).toBe('ar');
      expect(result.value.defaultCountry).toBe('EG');
    }
  });

  it('should return error when BOT_TOKEN is missing', () => {
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '123';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should return error when DATABASE_URL is missing', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['SUPER_ADMIN_IDS'] = '123';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should parse empty SUPER_ADMIN_IDS as empty array', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([]);
    }
  });

  it('should return error for non-numeric SUPER_ADMIN_IDS', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = 'abc,def';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should parse single SUPER_ADMIN_ID correctly', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '42';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([42]);
    }
  });

  it('should reject SUPER_ADMIN_IDS containing zero', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '0';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should reject SUPER_ADMIN_IDS containing zero among valid IDs', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '123,0,456';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });
});
