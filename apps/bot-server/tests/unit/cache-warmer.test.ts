import { describe, it, expect, vi, beforeEach } from 'vitest';
import { warmCaches } from '../../src/startup/cache-warmer.js';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnThis(),
};

const mockSettingsWarmer = {
  warmAll: vi.fn().mockResolvedValue(undefined),
};

const mockI18nWarmer = {
  warmAll: vi.fn().mockResolvedValue(undefined),
};

function makeDeps() {
  return {
    settingsWarmer: mockSettingsWarmer,
    i18nWarmer: mockI18nWarmer,
    logger: mockLogger,
  };
}

describe('warmCaches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsWarmer.warmAll.mockResolvedValue(undefined);
    mockI18nWarmer.warmAll.mockResolvedValue(undefined);
  });

  it('returns ok when both warmers succeed', async () => {
    const result = await warmCaches(makeDeps());

    expect(result.isOk()).toBe(true);
    expect(mockSettingsWarmer.warmAll).toHaveBeenCalledOnce();
    expect(mockI18nWarmer.warmAll).toHaveBeenCalledOnce();
  });

  it('logs warning and continues when settings warming fails', async () => {
    mockSettingsWarmer.warmAll.mockRejectedValue(new Error('settings db down'));

    const result = await warmCaches(makeDeps());

    expect(result.isOk()).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Settings cache warming failed' }),
    );
    expect(mockI18nWarmer.warmAll).toHaveBeenCalledOnce();
  });

  it('logs warning and returns ok when translation warming fails', async () => {
    mockI18nWarmer.warmAll.mockRejectedValue(new Error('i18n files missing'));

    const result = await warmCaches(makeDeps());

    expect(result.isOk()).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Translation cache warming failed' }),
    );
  });

  it('logs two warnings and returns ok when both fail', async () => {
    mockSettingsWarmer.warmAll.mockRejectedValue(new Error('settings boom'));
    mockI18nWarmer.warmAll.mockRejectedValue(new Error('i18n boom'));

    const result = await warmCaches(makeDeps());

    expect(result.isOk()).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
  });

  it('warms settings before translations (order enforced)', async () => {
    const callOrder: string[] = [];

    mockSettingsWarmer.warmAll.mockImplementation(async () => {
      callOrder.push('settings');
    });
    mockI18nWarmer.warmAll.mockImplementation(async () => {
      callOrder.push('i18n');
    });

    await warmCaches(makeDeps());

    expect(callOrder).toEqual(['settings', 'i18n']);
  });
});
