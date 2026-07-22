import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { MainMenuFactory } from '../../menus/main-menu.factory.js';
import { getUserService } from '../../services/user-service.context.js';
import { startCommand } from '../../commands/start.command.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

vi.mock('../../menus/main-menu.factory.js', () => ({
  MainMenuFactory: {
    create: vi.fn(),
  },
}));

function createContext(): Context {
  return {
    from: { id: 123456789, first_name: 'Visitor' },
    chat: { id: 123456789 },
    reply: vi.fn(),
  } as unknown as Context;
}

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

function user(overrides: Record<string, unknown>) {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'visitor',
    language: 'en',
    role: 'GUEST',
    status: 'ACTIVE',
    createdAt: new Date('2026-07-23T00:00:00.000Z'),
    updatedAt: new Date('2026-07-23T00:00:00.000Z'),
    ...overrides,
  };
}

describe('startCommand guest and status behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue({ isOk: () => false }),
        saveSession: vi.fn(),
      },
      settings: { get: vi.fn().mockResolvedValue('private') },
      config: {} as never,
    });
  });

  it('should offer membership request again for known active guest users', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({ isErr: () => false, value: user({}) }),
    } as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.request_prompt', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
  });

  it('should stop known banned users before rendering membership or member menus', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: user({ status: 'BANNED' }),
      }),
    } as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.blocked_status', {
      parse_mode: 'HTML',
    });
  });
});
