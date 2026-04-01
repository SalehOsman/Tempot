import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storageToggle } from '../../src/storage.toggle.js';

const ENV_VAR = 'TEMPOT_STORAGE_ENGINE';

describe('storageToggle', () => {
  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('check() returns null when env var is not set (default enabled)', () => {
    expect(storageToggle.check()).toBeNull();
  });

  it('check() returns null when env var is "true"', () => {
    process.env[ENV_VAR] = 'true';
    expect(storageToggle.check()).toBeNull();
  });

  it('check() returns Err with code "storage-engine.disabled" when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    const result = storageToggle.check();
    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('storage-engine.disabled');
      expect(result!.error.details).toEqual({ envVar: ENV_VAR });
    }
  });

  it('isEnabled() returns true when env var is not set', () => {
    expect(storageToggle.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    expect(storageToggle.isEnabled()).toBe(false);
  });

  it('exposes correct envVar and packageName', () => {
    expect(storageToggle.envVar).toBe(ENV_VAR);
    expect(storageToggle.packageName).toBe('storage-engine');
  });
});
