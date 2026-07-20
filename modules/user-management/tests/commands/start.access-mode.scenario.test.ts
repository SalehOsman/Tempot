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

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
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

function createContext(): Context {
  return {
    from: { id: 123456789, first_name: 'Visitor' },
    reply: vi.fn(),
  } as unknown as Context;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function unknownUserService() {
  return {
    getByTelegramId: vi.fn().mockResolvedValue({
      isErr: () => true,
      error: { code: 'USER_NOT_FOUND' },
    }),
  };
}

function knownUserService(user: Record<string, unknown>) {
  return {
    getByTelegramId: vi.fn().mockResolvedValue({
      isErr: () => false,
      value: user,
    }),
  };
}

describe('startCommand access-mode scenarios', () => {
  const publish = vi.fn();
  const t = vi.fn((key: string, options?: Record<string, unknown>) =>
    options?.['name'] ? `${key}:${String(options['name'])}` : key,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserService).mockReturnValue(unknownUserService() as never);
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn().mockResolvedValue('private') },
      config: {} as never,
    });
    publish.mockResolvedValue({ isOk: () => true });
  });

  it('should expose only membership request action for unknown visitors in private mode', async () => {
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.request_prompt', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
    const reply = ctx.reply as ReturnType<typeof vi.fn>;
    const options = reply.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual(['membership:request']);
  });

  it('should show pending status without member menu for pending visitors', async () => {
    const ctx = {
      ...createContext(),
      sessionUser: { id: '123456789', role: 'GUEST', status: 'PENDING' },
    } as unknown as Context;

    await startCommand(ctx);

    expect(MainMenuFactory.create).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.pending_status', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
  });

  it('should include public navigation entries for unknown visitors in public mode', async () => {
    const publicEntries = [
      {
        id: 'help',
        labelKey: 'user-management.menu.button.help',
        callbackData: 'help:view',
        requiredRole: 'GUEST',
        accessClassification: 'public',
        row: 0,
        order: 10,
      },
    ] as const;
    const navigation = {
      getMainMenuItems: vi.fn().mockReturnValue([]),
      getVisibleMainMenuItems: vi.fn().mockReturnValue(publicEntries),
    };
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn().mockResolvedValue('public') },
      navigation,
      config: {} as never,
    });
    const ctx = createContext();

    await startCommand(ctx);

    expect(navigation.getVisibleMainMenuItems).toHaveBeenCalledWith({
      role: 'GUEST',
      abilities: [],
    });
    expect(ctx.reply).toHaveBeenCalledWith('user-management.membership.public_prompt', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
    const reply = ctx.reply as ReturnType<typeof vi.fn>;
    const options = reply.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual(['membership:request', 'help:view']);
  });

  it('should show the member menu after an approved membership profile exists', async () => {
    const approvedUser = {
      id: 'user-1',
      username: 'approved-user',
      email: 'approved@example.com',
      language: 'en',
      role: 'USER',
      telegramId: '123456789',
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
      updatedAt: new Date('2026-07-07T00:00:00.000Z'),
    };
    vi.mocked(getUserService).mockReturnValue(knownUserService(approvedUser) as never);
    const keyboard = { inline_keyboard: [] };
    vi.mocked(MainMenuFactory.create).mockReturnValue(keyboard as never);
    const ctx = createContext();

    await startCommand(ctx);

    expect(MainMenuFactory.create).toHaveBeenCalledWith(approvedUser, { t }, []);
    expect(ctx.reply).toHaveBeenCalledWith('user-management.menu.welcome:approved-user', {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    expect(publish).toHaveBeenCalledWith('user-management.user.started', {
      userId: 'user-1',
      telegramId: '123456789',
      role: 'USER',
    });
  });

  it('should render regional Arabic locale with the base language label', async () => {
    t.mockImplementation((key: string, options?: Record<string, unknown>) => {
      if (key === 'user-management.language.ar') return 'Arabic';
      if (options?.['name']) return `${key}:${String(options['name'])}`;
      return key;
    });
    const approvedUser = {
      id: 'user-1',
      username: 'approved-user',
      email: 'approved@example.com',
      language: 'ar-EG',
      role: 'USER',
      telegramId: '123456789',
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
      updatedAt: new Date('2026-07-07T00:00:00.000Z'),
    };
    vi.mocked(getUserService).mockReturnValue(knownUserService(approvedUser) as never);
    vi.mocked(MainMenuFactory.create).mockReturnValue({ inline_keyboard: [] } as never);

    await startCommand(createContext());

    expect(t).toHaveBeenCalledWith(
      'user-management.menu.welcome',
      expect.objectContaining({
        language: 'Arabic',
      }),
    );
  });

  it('should preserve super-admin bootstrap menu visibility', async () => {
    const superAdmin = {
      id: 'admin-1',
      username: 'root-admin',
      email: 'root@example.com',
      language: 'en',
      role: 'SUPER_ADMIN',
      telegramId: '123456789',
      createdAt: new Date('2026-07-07T00:00:00.000Z'),
      updatedAt: new Date('2026-07-07T00:00:00.000Z'),
    };
    const navigationEntries = [
      {
        id: 'membership',
        labelKey: 'membership-management.menu.button',
        callbackData: 'membership:list',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.membership-request',
        row: 0,
        order: 10,
      },
    ] as const;
    const navigation = {
      getMainMenuItems: vi.fn().mockReturnValue([]),
      getVisibleMainMenuItems: vi.fn().mockReturnValue(navigationEntries),
    };
    registerDeps({
      logger: createLogger(),
      i18n: { t },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn().mockResolvedValue('private') },
      navigation,
      config: {} as never,
    });
    vi.mocked(getUserService).mockReturnValue(knownUserService(superAdmin) as never);
    const keyboard = { inline_keyboard: [] };
    vi.mocked(MainMenuFactory.create).mockReturnValue(keyboard as never);
    const ctx = {
      ...createContext(),
      ability: { rules: [{ action: 'manage', subject: 'all' }] },
    } as unknown as Context;

    await startCommand(ctx);

    expect(navigation.getVisibleMainMenuItems).toHaveBeenCalledWith({
      role: 'SUPER_ADMIN',
      abilities: ['manage.all'],
    });
    expect(MainMenuFactory.create).toHaveBeenCalledWith(superAdmin, { t }, navigationEntries);
  });
});
