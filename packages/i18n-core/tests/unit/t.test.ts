import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t } from '../../src/t.js';
import { sessionContext } from '@tempot/session-manager';
import i18next from 'i18next';

vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

describe('Context-Aware t()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fallback to Arabic if no session context', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);

    t('common.test');

    expect(i18next.t).toHaveBeenCalledWith('common.test', { lng: 'ar' });
  });

  it('should use language from session context', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      lang: 'en',
      userId: 'user-1',
    });

    t('common.test');

    expect(i18next.t).toHaveBeenCalledWith('common.test', { lng: 'en' });
  });

  it('should pass lng as a string even when store.lang is non-string', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      lang: 123,
    });

    t('common.test');

    // lng must always be a string — the function should coerce or fallback
    const call = vi.mocked(i18next.t).mock.calls[0];
    expect(typeof (call[1] as Record<string, unknown>).lng).toBe('string');
  });

  it('should merge additional options with lng', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);

    t('common.count', { count: 5 });

    expect(i18next.t).toHaveBeenCalledWith('common.count', { count: 5, lng: 'ar' });
  });

  it('should return the key name when translation is not found (T010)', () => {
    // i18next default behavior: returns the key when no translation exists
    vi.mocked(i18next.t).mockReturnValue('missing.key' as never);
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);

    const result = t('missing.key');

    expect(result).toBe('missing.key');
  });
});
