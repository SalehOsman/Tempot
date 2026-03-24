import { describe, it, expect, vi } from 'vitest';
import { loadModuleLocales } from '../../src/loader';
import i18next from 'i18next';
import { glob } from 'glob';

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

vi.mock('i18next', () => ({
  default: {
    addResourceBundle: vi.fn(),
  },
}));

// We need to mock fs/promises as well since loadModuleLocales will read files
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue(JSON.stringify({ testKey: 'Test Value' })),
  },
}));

describe('Modular Locale Loader', () => {
  it('should load JSON files from module directories', async () => {
    vi.mocked(glob).mockResolvedValue([
      'modules/auth/locales/ar.json',
      'modules/auth/locales/en.json',
    ]);

    const result = await loadModuleLocales();

    expect(result.isOk()).toBe(true);
    expect(glob).toHaveBeenCalledWith('modules/*/locales/*.json');
    expect(i18next.addResourceBundle).toHaveBeenCalledTimes(2);
    expect(i18next.addResourceBundle).toHaveBeenCalledWith(
      'ar',
      'auth',
      { testKey: 'Test Value' },
      true,
      true,
    );
    expect(i18next.addResourceBundle).toHaveBeenCalledWith(
      'en',
      'auth',
      { testKey: 'Test Value' },
      true,
      true,
    );
  });
});
