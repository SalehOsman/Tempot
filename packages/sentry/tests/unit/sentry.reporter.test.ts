import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppError } from '@tempot/shared';

// Hoist mock fns so they're accessible inside vi.mock factory
const { mockCaptureException, mockWithScope } = vi.hoisted(() => ({
  mockCaptureException: vi.fn().mockReturnValue('event-id-123'),
  mockWithScope: vi.fn().mockImplementation((callback: (scope: unknown) => void) => {
    const mockScope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
    };
    callback(mockScope);
    return mockScope;
  }),
}));

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
  captureException: mockCaptureException,
  withScope: mockWithScope,
}));

import { SentryReporter } from '../../src/sentry.reporter.js';
import { initSentry } from '../../src/sentry.client.js';
import {
  SENTRY_TAG_ERROR_REFERENCE,
  SENTRY_TAG_ERROR_CODE,
  SENTRY_CONTEXT_APP_ERROR,
} from '../../src/sentry.constants.js';

describe('SentryReporter', () => {
  let reporter: SentryReporter;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
    reporter = new SentryReporter();
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  describe('report', () => {
    it('returns ok(null) when toggle is disabled', () => {
      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('sets errorReference tag from error.referenceCode', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      (error as { referenceCode: string }).referenceCode = 'ERR-20260402-ABCD';

      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_REFERENCE,
        'ERR-20260402-ABCD',
      );
    });

    it('generates reference code when error has none', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      const refCodeCall = mockScope.setTag.mock.calls.find(
        (c: string[]) => c[0] === SENTRY_TAG_ERROR_REFERENCE,
      );
      expect(refCodeCall).toBeDefined();
      expect(refCodeCall![1]).toMatch(/^ERR-\d{8}-[A-Z0-9]{4}$/);
    });

    it('sets errorCode tag from error.code', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('auth.permission_denied');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_CODE,
        'auth.permission_denied',
      );
    });

    it('sets appError context with code, i18nKey, and details', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('db.query_failed', { table: 'users' });
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setContext).toHaveBeenCalledWith(
        SENTRY_CONTEXT_APP_ERROR,
        expect.objectContaining({
          code: 'db.query_failed',
          i18nKey: 'errors.db.query_failed',
        }),
      );
    });

    it('returns the Sentry event ID on success', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('event-id-123');
    });

    it('returns err when captureException throws', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      mockWithScope.mockImplementationOnce(() => {
        throw new Error('Sentry SDK crash');
      });

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('sentry.report_failed');
      }
    });
  });

  describe('reportWithReference', () => {
    it('uses the explicit reference code instead of error.referenceCode', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      (error as { referenceCode: string }).referenceCode = 'ERR-20260402-ORIG';

      const result = reporter.reportWithReference(error, 'ERR-20260402-OVRD');
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_REFERENCE,
        'ERR-20260402-OVRD',
      );
    });

    it('returns ok(null) when disabled', () => {
      const error = new AppError('test.error');
      const result = reporter.reportWithReference(error, 'ERR-20260402-XXXX');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });
});
