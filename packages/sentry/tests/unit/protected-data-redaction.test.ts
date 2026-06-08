import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@tempot/shared';

const { captureException, withScope } = vi.hoisted(() => ({
  captureException: vi.fn().mockReturnValue('event-id'),
  withScope: vi.fn().mockImplementation((callback: (scope: unknown) => void) => {
    callback({ setTag: vi.fn(), setContext: vi.fn() });
  }),
}));

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn(),
  captureException,
  withScope,
}));

import { initSentry } from '../../src/sentry.client.js';
import { SentryReporter } from '../../src/sentry.reporter.js';

describe('Sentry protected data redaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
  });

  it('removes protected canaries before assigning Sentry context', () => {
    const canary = 'sentry-canary@example.com';
    const reporter = new SentryReporter();

    const result = reporter.report(
      new AppError('database.protection.failed', {
        request: {
          email: canary,
          national_id: '29801011234567',
        },
      }),
    );

    expect(result.isOk()).toBe(true);
    const scopeCallback = withScope.mock.calls[0]?.[0];
    expect(scopeCallback).toBeTypeOf('function');
    const scope = { setTag: vi.fn(), setContext: vi.fn() };
    scopeCallback(scope);
    expect(JSON.stringify(scope.setContext.mock.calls)).not.toContain(canary);
    expect(JSON.stringify(scope.setContext.mock.calls)).not.toContain('29801011234567');
  });
});
