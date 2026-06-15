import { describe, expect, it } from 'vitest';
import { StaticSettingsLoader } from '../../src/static-settings.loader.js';

const baseEnvironment = {
  BOT_TOKEN: 'test-token',
  DATABASE_URL: 'postgresql://localhost/test',
  SUPER_ADMIN_IDS: '123',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_COUNTRY: 'EG',
};

describe('protected data key settings', () => {
  it('loads a valid versioned encryption and lookup key ring', () => {
    const result = StaticSettingsLoader.load({
      ...baseEnvironment,
      PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION: 'enc-v1',
      PROTECTED_DATA_ENCRYPTION_KEYS: JSON.stringify({
        'enc-v1': Buffer.alloc(32, 1).toString('base64'),
        'enc-v0': Buffer.alloc(32, 2).toString('base64'),
      }),
      PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION: 'lookup-v1',
      PROTECTED_DATA_LOOKUP_KEYS: JSON.stringify({
        'lookup-v1': Buffer.alloc(32, 3).toString('base64'),
      }),
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toMatchObject({
        protectedDataKeys: {
          activeEncryptionKeyVersion: 'enc-v1',
          activeLookupKeyVersion: 'lookup-v1',
        },
      });
    }
  });

  it('rejects key rings whose active version is missing', () => {
    const result = StaticSettingsLoader.load({
      ...baseEnvironment,
      PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION: 'enc-v2',
      PROTECTED_DATA_ENCRYPTION_KEYS: JSON.stringify({
        'enc-v1': Buffer.alloc(32, 1).toString('base64'),
      }),
      PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION: 'lookup-v1',
      PROTECTED_DATA_LOOKUP_KEYS: JSON.stringify({
        'lookup-v1': Buffer.alloc(32, 3).toString('base64'),
      }),
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('settings.protected_data.invalid_key_ring');
    }
  });

  it('rejects encryption and lookup keys that reuse the same material', () => {
    const sharedKey = Buffer.alloc(32, 7).toString('base64');
    const result = StaticSettingsLoader.load({
      ...baseEnvironment,
      PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION: 'enc-v1',
      PROTECTED_DATA_ENCRYPTION_KEYS: JSON.stringify({ 'enc-v1': sharedKey }),
      PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION: 'lookup-v1',
      PROTECTED_DATA_LOOKUP_KEYS: JSON.stringify({ 'lookup-v1': sharedKey }),
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('settings.protected_data.key_reuse');
    }
  });
});
