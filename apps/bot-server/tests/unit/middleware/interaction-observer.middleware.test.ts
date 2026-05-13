import { describe, expect, it, vi } from 'vitest';
import { createInteractionObserverMiddleware } from '../../../src/bot/middleware/interaction-observer.middleware.js';

interface MockContext {
  update: { update_id: number };
  message?: { text?: string };
  callbackQuery?: { data?: string };
  from?: { id: number };
  chat?: { id: number };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('createInteractionObserverMiddleware', () => {
  it('logs received and handled command updates with module metadata', async () => {
    const logger = createLogger();
    const middleware = createInteractionObserverMiddleware({
      logger,
      commandModuleMap: { '/bots': 'bot-management' },
    });
    const ctx: MockContext = {
      update: { update_id: 10 },
      message: { text: '/bots list' },
      from: { id: 123 },
      chat: { id: 456 },
    };
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.interaction_received',
        updateId: 10,
        updateType: 'command',
        command: '/bots',
        module: 'bot-management',
        userId: 123,
        chatId: 456,
        status: 'received',
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.interaction_handled',
        updateType: 'command',
        command: '/bots',
        status: 'handled',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('logs callback namespace metadata', async () => {
    const logger = createLogger();
    const middleware = createInteractionObserverMiddleware({ logger });
    const ctx: MockContext = {
      update: { update_id: 11 },
      callbackQuery: { data: 'bot-management:create' },
      from: { id: 123 },
      chat: { id: 456 },
    };

    await middleware(ctx as never, vi.fn().mockResolvedValue(undefined));

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.interaction_received',
        updateType: 'callback_query',
        callbackData: 'bot-management:create',
        callbackNamespace: 'bot-management',
        module: 'bot-management',
      }),
    );
  });

  it('normalizes known compact callback namespaces to module names', async () => {
    const logger = createLogger();
    const middleware = createInteractionObserverMiddleware({ logger });
    const ctx: MockContext = {
      update: { update_id: 13 },
      callbackQuery: { data: 'botmgmt:create' },
      from: { id: 123 },
      chat: { id: 456 },
    };

    await middleware(ctx as never, vi.fn().mockResolvedValue(undefined));

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.interaction_received',
        callbackNamespace: 'botmgmt',
        module: 'bot-management',
      }),
    );
  });

  it('logs failure metadata and rethrows handler errors', async () => {
    const logger = createLogger();
    const middleware = createInteractionObserverMiddleware({ logger });
    const ctx: MockContext = {
      update: { update_id: 12 },
      message: { text: '/start' },
      from: { id: 123 },
      chat: { id: 456 },
    };
    const failure = new Error('handler failed');

    await expect(middleware(ctx as never, vi.fn().mockRejectedValue(failure))).rejects.toThrow(
      'handler failed',
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.interaction_failed',
        updateType: 'command',
        command: '/start',
        status: 'failed',
        error: 'handler failed',
        durationMs: expect.any(Number),
      }),
    );
  });
});
