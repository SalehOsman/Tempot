import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tempot/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tempot/shared')>();
  return {
    ...actual,
    generateErrorReference: vi.fn(() => 'ERR-20260405-ABCD'),
  };
});

import { createErrorBoundary } from '../../src/bot/error-boundary.js';
import type { ErrorBoundaryDeps } from '../../src/bot/error-boundary.js';
import { generateErrorReference } from '@tempot/shared';

function createMockDeps(overrides: Partial<ErrorBoundaryDeps> = {}): ErrorBoundaryDeps {
  return {
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    },
    eventBus: {
      publish: vi.fn().mockResolvedValue({ isOk: () => true }),
    },
    auditLog: vi.fn().mockResolvedValue(undefined),
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
    from?: { id: number };
    chat?: { id: number };
    reply: ReturnType<typeof vi.fn>;
  } & Record<string, unknown>;
}

function createMockBotError(error: Error): MockBotError {
  return {
    error,
    ctx: {
      from: { id: 123 },
      chat: { id: 456 },
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

  it('links unhandled errors to the current interaction trace', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));
    botError.ctx['interactionTrace'] = {
      traceId: 'trace-1',
      updateId: 77,
      updateType: 'callback_query',
      callbackData: 'settings:open',
      callbackNamespace: 'settings',
      module: 'settings-management',
      userId: 123,
      chatId: 456,
      responseCount: 0,
      startedAt: 100,
    };

    await boundary(botError as never);

    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        callbackData: 'settings:open',
        module: 'settings-management',
      }),
    );
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'system.error',
      expect.objectContaining({
        referenceCode: 'ERR-20260405-ABCD',
        traceId: 'trace-1',
      }),
    );
    expect(deps.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        after: expect.objectContaining({
          referenceCode: 'ERR-20260405-ABCD',
          errorCode: 'bot-server.unhandled_error',
          callbackData: 'settings:open',
        }),
      }),
    );
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

    // The error is converted to AppError before reporting
    expect(sentryReporter.reportWithReference).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.unhandled_error',
        details: expect.objectContaining({
          error: 'sentry test',
        }),
      }),
      'ERR-20260405-ABCD',
    );
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
      ctx: { from: { id: 123 }, chat: { id: 456 }, reply: vi.fn().mockResolvedValue(undefined) },
    };

    await boundary(botError as never);

    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'string error',
      }),
    );
  });

  it('includes userId and chatId in error log payload (C4 — FR-012)', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    await boundary(botError as never);

    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 123,
        chatId: 456,
      }),
    );
  });

  it('logs warning when eventBus.publish fails (C1)', async () => {
    const deps = createMockDeps({
      eventBus: { publish: vi.fn().mockRejectedValue(new Error('bus down')) },
    });
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    await boundary(botError as never);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'bot-server.event_publish_failed' }),
    );
  });

  it('logs warning when sentry report fails (C1)', async () => {
    const sentryReporter = {
      reportWithReference: vi.fn().mockImplementation(() => {
        throw new Error('sentry crash');
      }),
    };
    const deps = createMockDeps({ sentryReporter });
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));

    await boundary(botError as never);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'bot-server.sentry_report_failed' }),
    );
  });

  it('logs warning when ctx.reply fails (C1)', async () => {
    const deps = createMockDeps();
    const boundary = createErrorBoundary(deps);
    const botError = createMockBotError(new Error('fail'));
    botError.ctx.reply.mockRejectedValue(new Error('blocked'));

    await boundary(botError as never);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'bot-server.error_reply_failed' }),
    );
  });
});
