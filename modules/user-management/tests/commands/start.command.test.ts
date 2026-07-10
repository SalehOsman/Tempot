import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { MainMenuFactory } from '../../menus/main-menu.factory.js';
import { getUserService } from '../../services/user-service.context.js';
import { startCommand } from '../../commands/start.command.js';
import { sessionContext } from '@tempot/shared';

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

  it('should reply with membership request prompt when user does not exist', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => true,
        error: { code: 'USER_NOT_FOUND' },
      }),
    } as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.request_prompt', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
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

    expect(MainMenuFactory.create).toHaveBeenCalledWith(mockUser, { t }, []);
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

  it('should build the menu from active module navigation entries', async () => {
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
    const navigationEntries = [
      {
        id: 'settings',
        labelKey: 'settings-management.menu.button',
        callbackData: 'settings:view',
        requiredRole: 'USER',
        row: 0,
        order: 20,
      },
    ] as const;
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: mockUser,
      }),
    } as never);
    const keyboard = { inline_keyboard: [] };
    vi.mocked(MainMenuFactory.create).mockReturnValue(keyboard as never);
    const navigation = {
      getMainMenuItems: vi.fn().mockReturnValue(navigationEntries),
    };
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      navigation,
      config: {} as never,
    });
    const ctx = createContext();

    await startCommand(ctx);

    expect(navigation.getMainMenuItems).toHaveBeenCalledWith('USER');
    expect(MainMenuFactory.create).toHaveBeenCalledWith(mockUser, { t }, navigationEntries);
  });

  it('should prefer ability-filtered navigation when the provider supports it', async () => {
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
    const navigationEntries = [
      {
        id: 'profile',
        labelKey: 'user-management.menu.button.profile',
        callbackData: 'profile:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.profile',
        row: 0,
        order: 10,
      },
    ] as const;
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: mockUser,
      }),
    } as never);
    const keyboard = { inline_keyboard: [] };
    vi.mocked(MainMenuFactory.create).mockReturnValue(keyboard as never);
    const navigation = {
      getMainMenuItems: vi.fn().mockReturnValue([]),
      getVisibleMainMenuItems: vi.fn().mockReturnValue(navigationEntries),
    };
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      navigation,
      config: {} as never,
    });
    const ctx = {
      ...createContext(),
      ability: { rules: [{ action: 'read', subject: 'profile' }] },
    } as unknown as Context;

    await startCommand(ctx);

    expect(navigation.getVisibleMainMenuItems).toHaveBeenCalledWith({
      role: 'USER',
      abilities: ['read.profile'],
    });
    expect(navigation.getMainMenuItems).not.toHaveBeenCalled();
    expect(MainMenuFactory.create).toHaveBeenCalledWith(mockUser, { t }, navigationEntries);
  });

  it('should render known users with the persisted profile language when session language is stale', async () => {
    const staleSession = {
      userId: '123456789',
      chatId: '123456789',
      role: 'USER',
      status: 'ACTIVE',
      language: 'ar',
      activeConversation: null,
      metadata: null,
      schemaVersion: 1,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const saveSession = vi.fn().mockResolvedValue({ isOk: () => true });
    const profile = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      language: 'en',
      role: 'USER',
      telegramId: '123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const localeAwareT = vi.fn((key: string, options?: Record<string, unknown>) => {
      const locale = sessionContext.getStore()?.locale ?? 'none';
      return options?.['name'] ? `${locale}:${key}:${String(options['name'])}` : `${locale}:${key}`;
    });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({ isErr: () => false, value: profile }),
    } as never);
    vi.mocked(MainMenuFactory.create).mockReturnValue({ inline_keyboard: [] } as never);
    registerDeps({
      logger: createLogger(),
      i18n: { t: localeAwareT },
      eventBus: { publish },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue(staleSession),
        saveSession,
      },
      settings: { get: vi.fn() },
      config: {} as never,
    });
    const ctx = createContext();

    await sessionContext.run({ userId: '1', locale: 'ar' }, async () => {
      await startCommand(ctx);
    });

    expect(ctx.reply).toHaveBeenCalledWith('en:user-management.menu.welcome:testuser', {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    });
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
  });
});
