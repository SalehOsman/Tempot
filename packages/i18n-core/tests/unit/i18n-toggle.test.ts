import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => `translated:${key}`),
  },
}));

describe('i18nToggle', () => {
  const ENV_VAR = 'TEMPOT_I18N_CORE';

  beforeEach(() => {
    delete process.env[ENV_VAR];
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('check() returns null when env var is not set (default enabled)', async () => {
    const { i18nToggle } = await import('../../src/i18n.toggle.js');
    expect(i18nToggle.check()).toBeNull();
  });

  it('check() returns Err with code i18n-core.disabled when env var is "false"', async () => {
    process.env[ENV_VAR] = 'false';
    const { i18nToggle } = await import('../../src/i18n.toggle.js');
    const result = i18nToggle.check();

    expect(result).not.toBeNull();
    expect(result!.isErr()).toBe(true);
    if (result!.isErr()) {
      expect(result!.error.code).toBe('i18n-core.disabled');
    }
  });

  it('isEnabled() returns true when env var is not set', async () => {
    const { i18nToggle } = await import('../../src/i18n.toggle.js');
    expect(i18nToggle.isEnabled()).toBe(true);
  });

  it('isEnabled() returns false when env var is "false"', async () => {
    process.env[ENV_VAR] = 'false';
    const { i18nToggle } = await import('../../src/i18n.toggle.js');
    expect(i18nToggle.isEnabled()).toBe(false);
  });
});

describe('t() returns key when i18n-core is disabled', () => {
  const ENV_VAR = 'TEMPOT_I18N_CORE';

  beforeEach(() => {
    delete process.env[ENV_VAR];
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  it('returns the key string itself when disabled (string key)', async () => {
    process.env[ENV_VAR] = 'false';
    const { t } = await import('../../src/i18n.translator.js');

    const result = t('some.key');

    expect(result).toBe('some.key');
  });

  it('returns the first key when disabled (array key)', async () => {
    process.env[ENV_VAR] = 'false';
    const { t } = await import('../../src/i18n.translator.js');

    const result = t(['first.key', 'second.key']);

    expect(result).toBe('first.key');
  });
});
