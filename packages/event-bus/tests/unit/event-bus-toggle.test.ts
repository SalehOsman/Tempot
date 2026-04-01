import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eventBusToggle } from '../../src/event-bus.toggle.js';

describe('eventBusToggle (Rule XVI)', () => {
  const ENV_VAR = 'TEMPOT_EVENT_BUS';
  const originalEnv = process.env[ENV_VAR];

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_VAR];
    } else {
      process.env[ENV_VAR] = originalEnv;
    }
  });

  it('check() returns null when TEMPOT_EVENT_BUS is not set (default enabled)', () => {
    const result = eventBusToggle.check();
    expect(result).toBeNull();
  });

  it('check() returns Err with code event-bus.disabled when TEMPOT_EVENT_BUS=false', () => {
    process.env[ENV_VAR] = 'false';
    const result = eventBusToggle.check();

    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('event-bus.disabled');
    }
  });

  it('isEnabled() returns true when TEMPOT_EVENT_BUS is not set', () => {
    expect(eventBusToggle.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when TEMPOT_EVENT_BUS=false', () => {
    process.env[ENV_VAR] = 'false';
    expect(eventBusToggle.isEnabled()).toBe(false);
  });

  it('exposes correct envVar and packageName', () => {
    expect(eventBusToggle.envVar).toBe('TEMPOT_EVENT_BUS');
    expect(eventBusToggle.packageName).toBe('event-bus');
  });
});
