import { describe, it, expect, vi, beforeEach } from 'vitest';
import pino from 'pino';
import { appErrorSerializer } from '../../src/technical/serializer.js';
import { SENSITIVE_KEYS } from '../../src/config.js';
import { sessionContext } from '@tempot/session-manager';
import { AppError } from '@tempot/shared';

// Mock sessionContext
vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

describe('Pino Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include userId from session context in logs', () => {
    const mockStore = { userId: 'user-123' };
    vi.mocked(sessionContext.getStore).mockReturnValue(mockStore);

    let logOutput = '';
    const dest = {
      write: (msg: string) => {
        logOutput = msg;
      },
    };

    const testLogger = pino(
      {
        mixin: () => {
          const store = sessionContext.getStore();
          return store ? { userId: store.userId } : {};
        },
      },
      dest,
    );

    testLogger.info('test message');
    const parsedLog = JSON.parse(logOutput);
    expect(parsedLog).toHaveProperty('userId', 'user-123');
  });

  it('should redact top-level sensitive keys', () => {
    let logOutput = '';
    const dest = {
      write: (msg: string) => {
        logOutput = msg;
      },
    };

    const testLogger = pino(
      {
        redact: SENSITIVE_KEYS,
      },
      dest,
    );

    testLogger.info(
      { password: 'secret-password', token: 'secret-token', other: 'public' },
      'test message',
    );
    const parsedLog = JSON.parse(logOutput);

    expect(parsedLog.password).toBe('[Redacted]');
    expect(parsedLog.token).toBe('[Redacted]');
    expect(parsedLog.other).toBe('public');
  });

  it('should use appErrorSerializer for AppError objects', () => {
    let logOutput = '';
    const dest = {
      write: (msg: string) => {
        logOutput = msg;
      },
    };

    const testLogger = pino(
      {
        serializers: {
          err: appErrorSerializer,
        },
      },
      dest,
    );

    const error = new AppError('TEST_CODE', { password: 'inner-secret' });
    testLogger.error({ err: error }, 'error occurred');

    const parsedLog = JSON.parse(logOutput);
    expect(parsedLog.err).toHaveProperty('code', 'TEST_CODE');
    expect(parsedLog.err).toHaveProperty('i18nKey', 'errors.TEST_CODE');
    expect(parsedLog.err.details.password).toBe('[REDACTED]');
  });
});
