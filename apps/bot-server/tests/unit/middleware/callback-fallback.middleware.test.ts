import { describe, expect, it, vi } from 'vitest';
import { createCallbackFallbackMiddleware } from '../../../src/bot/middleware/callback-fallback.middleware.js';

interface MockContext {
  callbackQuery?: { data?: string };
  from?: { id: number };
  chat?: { id: number };
  answerCallbackQuery?: ReturnType<typeof vi.fn>;
  reply?: ReturnType<typeof vi.fn>;
}

function createDeps() {
  return {
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
    },
    t: (key: string) => key,
  };
}

describe('createCallbackFallbackMiddleware', () => {
  it('passes through non-callback updates', async () => {
    const deps = createDeps();
    const middleware = createCallbackFallbackMiddleware(deps);
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware({} as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(deps.logger.warn).not.toHaveBeenCalled();
  });

  it('logs and responds when callback reaches fallback', async () => {
    const deps = createDeps();
    const middleware = createCallbackFallbackMiddleware(deps);
    const ctx: MockContext = {
      callbackQuery: { data: 'unknown:action' },
      from: { id: 123 },
      chat: { id: 456 },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await middleware(ctx as never, vi.fn());

    expect(ctx.answerCallbackQuery).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenCalledWith('bot-server.callback_unhandled');
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.callback_unhandled',
        callbackData: 'unknown:action',
        callbackNamespace: 'unknown',
        userId: 123,
        chatId: 456,
      }),
    );
  });

  it('handles an old callback from a disabled module without invoking business logic', async () => {
    const deps = createDeps();
    const middleware = createCallbackFallbackMiddleware(deps);
    const businessHandler = vi.fn();
    const ctx: MockContext = {
      callbackQuery: { data: 'disabled-module:mutate:record-1' },
      from: { id: 123 },
      chat: { id: 456 },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await middleware(ctx as never, businessHandler);

    expect(businessHandler).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('bot-server.callback_unhandled');
  });

  it('logs callback answer failures without throwing', async () => {
    const deps = createDeps();
    const middleware = createCallbackFallbackMiddleware(deps);
    const ctx: MockContext = {
      callbackQuery: { data: 'unknown:action' },
      answerCallbackQuery: vi.fn().mockRejectedValue(new Error('answer failed')),
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await expect(middleware(ctx as never, vi.fn())).resolves.toBeUndefined();

    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.callback_answer_failed',
        error: 'answer failed',
      }),
    );
  });
});
