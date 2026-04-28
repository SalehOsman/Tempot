import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { ProfileMenuFactory } from '../../menus/profile-menu.factory.js';
import { getUserService } from '../../services/user-service.context.js';
import { profileCommand } from '../../commands/profile.command.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

vi.mock('../../menus/profile-menu.factory.js', () => ({
  ProfileMenuFactory: {
    createView: vi.fn(),
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

describe('profileCommand', () => {
  const t = vi.fn((key: string, options?: Record<string, unknown>) =>
    options?.['username'] ? `${key}:${String(options['username'])}` : key,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      config: {} as never,
    });
  });

  it('should reply with an i18n error when user is not identified', async () => {
    const ctx = createContext(null);

    await profileCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('user-management.errors.no_user');
  });

  it('should reply with profile not found when profile does not exist', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => true,
        error: { code: 'USER_NOT_FOUND' },
      }),
    } as never);
    const ctx = createContext();

    await profileCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('user-management.profile.not_found');
  });

  it('should reply with profile message and menu when user exists', async () => {
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
    vi.mocked(ProfileMenuFactory.createView).mockReturnValue(keyboard as never);
    const ctx = createContext();

    await profileCommand(ctx);

    expect(ProfileMenuFactory.createView).toHaveBeenCalledWith(mockUser, { t });
    expect(ctx.reply).toHaveBeenCalledWith('user-management.profile.view_message:testuser', {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  });
});
