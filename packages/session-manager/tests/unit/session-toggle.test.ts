import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sessionToggle } from '../../src/session.toggle.js';

const ENV_VAR = 'TEMPOT_SESSION_MANAGER';

describe('sessionToggle', () => {
  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('check() returns null when env var is not set (default enabled)', () => {
    expect(sessionToggle.check()).toBeNull();
  });

  it('check() returns null when env var is "true"', () => {
    process.env[ENV_VAR] = 'true';
    expect(sessionToggle.check()).toBeNull();
  });

  it('check() returns Err with code "session-manager.disabled" when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    const result = sessionToggle.check();
    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('session-manager.disabled');
      expect(result!.error.details).toEqual({ envVar: ENV_VAR });
    }
  });

  it('isEnabled() returns true when env var is not set', () => {
    expect(sessionToggle.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when env var is "false"', () => {
    process.env[ENV_VAR] = 'false';
    expect(sessionToggle.isEnabled()).toBe(false);
  });

  it('exposes correct envVar and packageName', () => {
    expect(sessionToggle.envVar).toBe(ENV_VAR);
    expect(sessionToggle.packageName).toBe('session-manager');
  });
});
