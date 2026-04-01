import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tempot/shared', async () => {
  const actual = await vi.importActual<typeof import('@tempot/shared')>('@tempot/shared');
  return {
    ...actual,
    sessionContext: {
      getStore: vi.fn(),
    },
  };
});

describe('regionalToggle', () => {
  const ENV_VAR = 'TEMPOT_REGIONAL_ENGINE';

  beforeEach(() => {
    delete process.env[ENV_VAR];
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('check() returns null when env var is not set (default enabled)', async () => {
    const { regionalToggle } = await import('../../src/regional.toggle.js');
    expect(regionalToggle.check()).toBeNull();
  });

  it('check() returns Err with code regional-engine.disabled when env var is "false"', async () => {
    process.env[ENV_VAR] = 'false';
    const { regionalToggle } = await import('../../src/regional.toggle.js');
    const result = regionalToggle.check();

    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('regional-engine.disabled');
    }
  });

  it('isEnabled() returns true when env var is not set', async () => {
    const { regionalToggle } = await import('../../src/regional.toggle.js');
    expect(regionalToggle.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when env var is "false"', async () => {
    process.env[ENV_VAR] = 'false';
    const { regionalToggle } = await import('../../src/regional.toggle.js');
    expect(regionalToggle.isEnabled()).toBe(false);
  });
});
