import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('i18n Configuration', () => {
  beforeEach(() => {
    vi.stubEnv('TEMPOT_DEFAULT_LANGUAGE', undefined as unknown as string);
    vi.stubEnv('TEMPOT_FALLBACK_LANGUAGE', undefined as unknown as string);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should have Arabic as primary and English as secondary language by default', async () => {
    const { i18nConfig } = await import('../../src/i18n.config.js');
    expect(i18nConfig.lng).toBe('ar');
    expect(i18nConfig.fallbackLng).toBe('en');
    expect(i18nConfig.supportedLngs).toEqual(['ar', 'en']);
  });

  it('should read primary language from TEMPOT_DEFAULT_LANGUAGE env var', async () => {
    vi.stubEnv('TEMPOT_DEFAULT_LANGUAGE', 'fr');
    const { i18nConfig } = await import('../../src/i18n.config.js');
    expect(i18nConfig.lng).toBe('fr');
  });

  it('should read fallback language from TEMPOT_FALLBACK_LANGUAGE env var', async () => {
    vi.stubEnv('TEMPOT_FALLBACK_LANGUAGE', 'de');
    const { i18nConfig } = await import('../../src/i18n.config.js');
    expect(i18nConfig.fallbackLng).toBe('de');
  });

  it('should include both env-driven languages in supportedLngs', async () => {
    vi.stubEnv('TEMPOT_DEFAULT_LANGUAGE', 'fr');
    vi.stubEnv('TEMPOT_FALLBACK_LANGUAGE', 'de');
    const { i18nConfig } = await import('../../src/i18n.config.js');
    expect(i18nConfig.supportedLngs).toEqual(['fr', 'de']);
  });

  it('should export DEFAULT_LANGUAGE and FALLBACK_LANGUAGE constants', async () => {
    vi.stubEnv('TEMPOT_DEFAULT_LANGUAGE', 'tr');
    vi.stubEnv('TEMPOT_FALLBACK_LANGUAGE', 'es');
    const { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } = await import('../../src/i18n.config.js');
    expect(DEFAULT_LANGUAGE).toBe('tr');
    expect(FALLBACK_LANGUAGE).toBe('es');
  });

  it('should default to ar/en when env vars are not set (backward compatibility)', async () => {
    // Ensure env vars are not set
    delete process.env.TEMPOT_DEFAULT_LANGUAGE;
    delete process.env.TEMPOT_FALLBACK_LANGUAGE;
    const { i18nConfig, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } =
      await import('../../src/i18n.config.js');
    expect(DEFAULT_LANGUAGE).toBe('ar');
    expect(FALLBACK_LANGUAGE).toBe('en');
    expect(i18nConfig.lng).toBe('ar');
    expect(i18nConfig.fallbackLng).toBe('en');
  });
});
