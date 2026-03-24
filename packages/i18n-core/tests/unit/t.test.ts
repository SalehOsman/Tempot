import { describe, it, expect, vi } from 'vitest';
import { t } from '../../src/t';
import { sessionContext } from '@tempot/session-manager';
import i18next from 'i18next';

vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key) => key),
  },
}));

describe('Context-Aware t()', () => {
  it('should fallback to Arabic if no session context', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);

    t('common.test');

    expect(i18next.t).toHaveBeenCalledWith('common.test', { lng: 'ar' });
  });

  it('should use language from session context', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      lang: 'en',
      userId: 1,
      role: 'USER',
      sessionId: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    });

    t('common.test');

    expect(i18next.t).toHaveBeenCalledWith('common.test', { lng: 'en' });
  });
});
