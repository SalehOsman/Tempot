import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadModuleLocales } from '../../src/i18n.loader.js';
import i18next from 'i18next';
import { glob } from 'glob';
import { AppError } from '@tempot/shared';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load JSON files from module directories', async () => {
    vi.mocked(glob)
      .mockResolvedValueOnce(['modules/auth/locales/ar.json', 'modules/auth/locales/en.json'])
      .mockResolvedValueOnce([]);

    const result = await loadModuleLocales();

    expect(result.isOk()).toBe(true);
    expect(glob).toHaveBeenCalledWith(expect.stringContaining('modules/*/locales/*.json'));
    expect(glob).toHaveBeenCalledWith(expect.stringContaining('apps/*/locales/*.json'));
    expect(i18next.addResourceBundle).toHaveBeenCalledTimes(2);
    expect(i18next.addResourceBundle).toHaveBeenCalledWith(
      'ar',
      'translation',
      { testKey: 'Test Value' },
      true,
      true,
    );
    expect(i18next.addResourceBundle).toHaveBeenCalledWith(
      'en',
      'translation',
      { testKey: 'Test Value' },
      true,
      true,
    );
  });

  it('should return Err with AppError when glob fails', async () => {
    vi.mocked(glob).mockRejectedValue(new Error('ENOENT: directory not found'));

    const result = await loadModuleLocales();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe('i18n.locale_load_failed');
    }
  });

  it('should return Ok with no bundles when no locale files found', async () => {
    vi.mocked(glob).mockResolvedValue([]);

    const result = await loadModuleLocales();

    expect(result.isOk()).toBe(true);
    expect(i18next.addResourceBundle).not.toHaveBeenCalled();
  });

  it('should resolve locale globs from the repository root when cwd is a filtered package directory', async () => {
    const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tempot-i18n-root-'));
    const filteredCwd = path.join(repositoryRoot, 'apps', 'bot-server');
    fs.mkdirSync(path.join(repositoryRoot, 'modules'), { recursive: true });
    fs.mkdirSync(path.join(repositoryRoot, 'packages'), { recursive: true });
    fs.mkdirSync(filteredCwd, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(filteredCwd);
    vi.mocked(glob).mockResolvedValue([]);

    const result = await loadModuleLocales();

    expect(result.isOk()).toBe(true);
    expect(glob).toHaveBeenCalledWith(
      path.join(repositoryRoot, 'modules', '*', 'locales', '*.json').replace(/\\/g, '/'),
    );
    expect(glob).toHaveBeenCalledWith(
      path.join(repositoryRoot, 'apps', '*', 'locales', '*.json').replace(/\\/g, '/'),
    );

    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  });
});
