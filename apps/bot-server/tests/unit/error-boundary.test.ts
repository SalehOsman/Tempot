import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tempot/shared', () => ({
  generateErrorReference: vi.fn(() => 'ERR-20260405-ABCD'),
}));

import { createErrorBoundary } from '../../src/bot/error-boundary.js';
import type { ErrorBoundaryDeps } from '../../src/bot/error-boundary.js';
import { generateErrorReference } from '@tempot/shared';

function createMockDeps(overrides: Partial<ErrorBoundaryDeps> = {}): ErrorBoundaryDeps {
  return {
    logger: {
      error: vi.fn(),
    },
    eventBus: {
      publish: vi.fn().mockResolvedValue({ isOk: () => true }),
    },
    t: vi.fn(
      (key: string, opts?: Record<string, unknown>) =>
        `translated:${key}:${opts ? JSON.stringify(opts) : ''}`,
    ),
    ...overrides,
  };
}

interface MockBotError {
  error: Error;
  ctx: {
    reply: ReturnType<typeof vi.fn>;
  };
}

function createMockBotError(error: Error): MockBotError {
  return {
    error,
    ctx: {
      reply: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('createErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('catches unhandled errors and generates ERR-YYYYMMDD-XXXX reference', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('Something broke'));

    await boundary(botError as never);

    expect(generateErrorReference).toHaveBeenCalledOnce();
  });

  it('logs full error with stack trace', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const error = new Error('Something broke');
    const botError = createMockBotError(error);

    await boundary(botError as never);

    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceCode: 'ERR-20260405-ABCD',
        error: 'Something broke',
        stack: expect.any(String) as string,
      }),
    );
  });

  it('sends localized user-facing message with reference code', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    await boundary(botError as never);

    expect(deps.t).toHaveBeenCalledWith('bot-server.error_message', {
      referenceCode: 'ERR-20260405-ABCD',
    });
    expect(botError.ctx.reply).toHaveBeenCalledOnce();
  });

  it('emits system.error event', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    await boundary(botError as never);

    expect(deps.eventBus.publish).toHaveBeenCalledWith('system.error', {
      referenceCode: 'ERR-20260405-ABCD',
      errorCode: 'bot-server.unhandled_error',
    });
  });

  it('reports to Sentry when enabled', async () => {
    const sentryReporter = {
      reportWithReference: vi.fn().mockReturnValue({ isOk: () => true }),
    };
    const deps = createMockDeps({ sentryReporter });
    const boundary = createErrorBoundary(deps);
    const error = new Error('sentry test');
    const botError = createMockBotError(error);

    await boundary(botError as never);

    expect(sentryReporter.reportWithReference).toHaveBeenCalledWith(error, 'ERR-20260405-ABCD');
  });

  it('skips Sentry when disabled', async () => {
    const deps = createMockDeps(); // no sentryReporter
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    // Should not throw
    await expect(boundary(botError as never)).resolves.toBeUndefined();
  });

  it('handles non-Error thrown values', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = {
      error: 'string error',
      ctx: { reply: vi.fn().mockResolvedValue(undefined) },
    };

    await boundary(botError as never);

    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'string error',
      }),
    );
  });
});
