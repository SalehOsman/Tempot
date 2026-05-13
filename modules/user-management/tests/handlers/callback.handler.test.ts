import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import { getUserService } from '../../services/user-service.context.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

function createLogger() {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger;
}

function createContext(data: string): Context {
  return {
    callbackQuery: { data },
    from: { id: 123456789 },
    answerCallbackQuery: vi.fn(),
  } as unknown as Context;
}

describe('handleCallbackQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      config: {} as never,
    });
  });

  it('passes non-user-management callback namespaces to downstream handlers', async () => {
    const ctx = createContext('ie:bot-management-registration:2:__cancel__');
    const next = vi.fn().mockResolvedValue(undefined);

    await handleCallbackQuery(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.answerCallbackQuery).not.toHaveBeenCalled();
    expect(getUserService).not.toHaveBeenCalled();
  });
});
