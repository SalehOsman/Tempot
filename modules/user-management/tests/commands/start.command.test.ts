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

function createContext(from: Context['from'] | null = { id: 123456789, first_name: 'Test User' }) {
  return {
    from,
    reply: vi.fn(),
  } as unknown as Context;
}

describe('startCommand', () => {
  const publish = vi.fn();
  const t = vi.fn((key: string, options?: Record<string, unknown>) =>
    options?.['name'] ? `${key}:${String(options['name'])}` : key,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      config: {} as never,
    });
    publish.mockResolvedValue({ isOk: () => true });
  });

  it('should reply with an i18n error when user is not identified', async () => {
    const ctx = createContext(null);

    await startCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('user-management.errors.no_user');
  });

  it('should reply with registration prompt when user does not exist', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => true,
        error: { code: 'USER_NOT_FOUND' },
      }),
    } as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('user-management.errors.register_first');
  });

  it('should reply with welcome message and menu when user exists', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      language: 'ar',
      role: 'USER',
      telegramId: '123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: mockUser,
      }),
    } as never);
    const keyboard = { inline_keyboard: [] };
    vi.mocked(MainMenuFactory.create).mockReturnValue(keyboard as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).toHaveBeenCalledWith(mockUser);
    expect(ctx.reply).toHaveBeenCalledWith('user-management.menu.welcome:testuser', {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    expect(publish).toHaveBeenCalledWith('user-management.user.started', {
      userId: '1',
      telegramId: '123456789',
      role: 'USER',
    });
  });
});
