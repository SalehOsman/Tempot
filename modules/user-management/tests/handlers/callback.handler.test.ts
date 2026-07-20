import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import { getUserService } from '../../services/user-service.context.js';
import type { UserProfile } from '../../types/index.js';

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
    callbackQuery: { data, message: { message_id: 10 } },
    from: { id: 123456789 },
    chat: { id: 987654321 },
    answerCallbackQuery: vi.fn(),
    editMessageText: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function createUserProfile(role: UserProfile['role'] = 'ADMIN'): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'admin',
    email: 'admin@example.com',
    language: 'ar',
    role,
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
  };
}

describe('handleCallbackQuery', () => {
  const enforce = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    enforce.mockResolvedValue(true);
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
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

  it('answers invalid callbacks and callbacks without Telegram users', async () => {
    const invalid = {
      callbackQuery: {},
      from: { id: 123456789 },
      answerCallbackQuery: vi.fn(),
    } as unknown as Context;
    const noUser = {
      callbackQuery: { data: 'profile:view' },
      answerCallbackQuery: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(invalid);
    await handleCallbackQuery(noUser);

    expect(invalid.answerCallbackQuery).toHaveBeenCalledWith(
      'user-management.errors.invalid_callback',
    );
    expect(noUser.answerCallbackQuery).toHaveBeenCalledWith('user-management.errors.no_user');
  });

  it('renders the user list without repeating the selected list callback', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile(),
      }),
      searchUsers: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: [createUserProfile()],
      }),
    } as never);
    const ctx = createContext('users:list');

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [, options] = vi.mocked(ctx.editMessageText).mock.calls[0]!;
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).not.toContain('users:list');
    expect(callbacks).toContain('users:search');
    expect(callbacks).toContain('menu:main');
  });

  it('renders user details for management view callbacks', async () => {
    const service = {
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile(),
      }),
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: {
          ...createUserProfile('USER'),
          id: 'user-2',
          telegramId: '222',
          username: 'target',
          governorate: 'eg.governorates.cairo',
        },
      }),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext('users:view:user-2');

    await handleCallbackQuery(ctx);

    expect(service.getById).toHaveBeenCalledWith('user-2');
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    expect(ctx.answerCallbackQuery).not.toHaveBeenCalledWith(
      'user-management.users.view_pending:{"id":"user-2"}',
    );
  });

  it('updates target user roles from confirmed management role callbacks', async () => {
    const updatedUser = { ...createUserProfile('ADMIN'), id: 'user-2', telegramId: '222' };
    const service = {
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile('SUPER_ADMIN'),
      }),
      updateRole: vi.fn().mockResolvedValue(ok(undefined)),
      getById: vi.fn().mockResolvedValue({ isErr: () => false, value: updatedUser }),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext('users:role-confirm:user-2:ADMIN');

    await handleCallbackQuery(ctx);

    expect(service.updateRole).toHaveBeenCalledWith('user-2', RoleEnum.ADMIN);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.role.success');
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
  });

  it('asks for confirmation before updating target user roles', async () => {
    const service = {
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile('SUPER_ADMIN'),
      }),
      updateRole: vi.fn().mockResolvedValue(ok(undefined)),
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: { ...createUserProfile('USER'), id: 'user-2', telegramId: '222' },
      }),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext('users:role:user-2:ADMIN');

    await handleCallbackQuery(ctx);

    expect(service.updateRole).not.toHaveBeenCalled();
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.role.confirm',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('updates target user roles only after confirmation', async () => {
    const updatedUser = { ...createUserProfile('ADMIN'), id: 'user-2', telegramId: '222' };
    const service = {
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile('SUPER_ADMIN'),
      }),
      updateRole: vi.fn().mockResolvedValue(ok(undefined)),
      getById: vi.fn().mockResolvedValue({ isErr: () => false, value: updatedUser }),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext('users:role-confirm:user-2:ADMIN');

    await handleCallbackQuery(ctx);

    expect(service.updateRole).toHaveBeenCalledWith('user-2', RoleEnum.ADMIN);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.role.success');
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
  });

  it('does not load or mutate users when management authorization is denied', async () => {
    enforce.mockResolvedValue(false);
    const ctx = createContext('users:list');

    await handleCallbackQuery(ctx);

    expect(enforce).toHaveBeenCalledWith(ctx, {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    });
    expect(getUserService).not.toHaveBeenCalled();
  });

  it('renders the main menu through the bootstrap policy', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile(),
      }),
    } as never);
    const ctx = createContext('menu:main');

    await handleCallbackQuery(ctx);

    expect(enforce).toHaveBeenCalledWith(ctx, {
      module: 'user-management',
      classification: 'bootstrap',
      action: 'read',
      subject: 'bootstrap',
    });
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
  });

  it('uses ability-filtered navigation when returning to the main menu', async () => {
    const menuEntries = [
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
    const navigation = {
      getMainMenuItems: vi.fn().mockReturnValue([]),
      getVisibleMainMenuItems: vi.fn().mockReturnValue(menuEntries),
    };
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
      navigation,
      config: {} as never,
    });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile('USER'),
      }),
    } as never);
    const ctx = {
      ...createContext('menu:main'),
      ability: { rules: [{ action: 'read', subject: 'profile' }] },
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(navigation.getVisibleMainMenuItems).toHaveBeenCalledWith({
      role: 'USER',
      abilities: ['read.profile'],
    });
    expect(navigation.getMainMenuItems).not.toHaveBeenCalled();
  });

  it('reports profile lookup misses and callback exceptions', async () => {
    vi.mocked(getUserService).mockReturnValueOnce({
      getByTelegramId: vi.fn().mockResolvedValue({ isErr: () => true }),
    } as never);
    const notFound = createContext('profile:view');

    await handleCallbackQuery(notFound);

    expect(notFound.answerCallbackQuery).toHaveBeenCalledWith('user-management.profile.not_found');

    vi.mocked(getUserService).mockReturnValueOnce({
      getByTelegramId: vi.fn().mockRejectedValue(new Error('service down')),
    } as never);
    const failed = createContext('profile:view');

    await handleCallbackQuery(failed);

    expect(failed.answerCallbackQuery).toHaveBeenCalledWith(
      'user-management.errors.callback_failed',
    );
  });

  it('uses role-management authorization for profile role edit callbacks', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile(),
      }),
    } as never);
    const ctx = createContext('profile:edit:role');

    await handleCallbackQuery(ctx);

    expect(enforce).toHaveBeenCalledWith(ctx, {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'roles',
    });
  });

  it.each(['users:roles:user-2', 'users:role:user-2:ADMIN', 'users:role-confirm:user-2:ADMIN'])(
    'uses role-management authorization for %s',
    async (callbackData) => {
      vi.mocked(getUserService).mockReturnValue({
        getByTelegramId: vi.fn().mockResolvedValue({
          isErr: () => false,
          value: createUserProfile('SUPER_ADMIN'),
        }),
        getById: vi.fn().mockResolvedValue({
          isErr: () => false,
          value: { ...createUserProfile('USER'), id: 'user-2', telegramId: '222' },
        }),
        updateRole: vi.fn().mockResolvedValue(ok(undefined)),
      } as never);
      const ctx = createContext(callbackData);

      await handleCallbackQuery(ctx);

      expect(enforce).toHaveBeenCalledWith(ctx, {
        module: 'user-management',
        classification: 'protected',
        action: 'manage',
        subject: 'roles',
      });
    },
  );
});
