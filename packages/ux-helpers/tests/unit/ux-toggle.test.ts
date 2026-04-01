import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { uxToggle } from '../../src/ux.toggle.js';

const ENV_VAR = 'TEMPOT_UX_HELPERS';

describe('uxToggle', () => {
  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('check() returns null when env var is not set (default enabled)', () => {
    expect(uxToggle.check()).toBeNull();
  });

  it('check() returns Err with code ux-helpers.disabled when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    const result = uxToggle.check();
    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('ux-helpers.disabled');
    }
  });

  it('check() returns null when env var is "true"', () => {
    process.env[ENV_VAR] = 'true';
    expect(uxToggle.check()).toBeNull();
  });

  it('exposes correct envVar and packageName', () => {
    expect(uxToggle.envVar).toBe(ENV_VAR);
    expect(uxToggle.packageName).toBe('ux-helpers');
  });
});
