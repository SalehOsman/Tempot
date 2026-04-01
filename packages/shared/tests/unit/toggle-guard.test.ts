import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createToggleGuard } from '../../src/toggle/toggle.guard.js';

describe('createToggleGuard', () => {
  const ENV_VAR = 'TEMPOT_TEST_PKG';
  const PKG_NAME = 'test-pkg';

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('returns null from check() when env var is not set (default enabled)', () => {
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.check()).toBeNull();
  });

  it('returns null from check() when env var is "true"', () => {
    process.env[ENV_VAR] = 'true';
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.check()).toBeNull();
  });

  it('returns Result.err when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    const result = guard.check();
    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('test-pkg.disabled');
      expect(result!.error.details).toEqual({ envVar: ENV_VAR });
    }
  });

  it('isEnabled() returns true when not set', () => {
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when set to "false"', () => {
    process.env[ENV_VAR] = 'false';
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.isEnabled()).toBe(false);
  });

  it('exposes envVar and packageName properties', () => {
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.envVar).toBe(ENV_VAR);
    expect(guard.packageName).toBe(PKG_NAME);
  });

  it('responds to runtime env var changes', () => {
    const guard = createToggleGuard(ENV_VAR, PKG_NAME);
    expect(guard.isEnabled()).toBe(true);

    process.env[ENV_VAR] = 'false';
    expect(guard.isEnabled()).toBe(false);

    delete process.env[ENV_VAR];
    expect(guard.isEnabled()).toBe(true);
  });
});
