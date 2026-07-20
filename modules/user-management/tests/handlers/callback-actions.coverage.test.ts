import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleEnum } from '@tempot/auth-core';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { registerDeps } from '../../deps.context.js';
import { safeEditMessageText } from '../../handlers/callback-shared.handler.js';
import { handleProfileAction } from '../../handlers/profile.callback.handler.js';
import { handleUsersAction } from '../../handlers/users.callback.handler.js';
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

function createContext(): Context {
  return {
    callbackQuery: { data: 'profile:view', message: { message_id: 10 } },
    from: { id: 123456789 },
    chat: { id: 987654321 },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function user(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'saleh',
    email: 'saleh@example.com',
    language: 'ar',
    role: RoleEnum.ADMIN,
    createdAt: new Date('2026-06-17T00:00:00.000Z'),
    updatedAt: new Date('2026-06-17T00:00:00.000Z'),
    messageCount: 3,
    completedTasks: 2,
    activeTime: '1h',
    rating: '5',
    ...overrides,
  };
}

function registerTestDeps(): ReturnType<typeof createLogger> {
  const logger = createLogger();
  registerDeps({
    logger,
    i18n: {
      t: vi.fn(
        (key: string, options?: Record<string, unknown>) =>
          `${key}:${JSON.stringify(options ?? {})}`,
      ),
    },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn().mockResolvedValue(null) },
    settings: { get: vi.fn() },
    authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
    config: {} as never,
  });
  return logger;
}

describe('safeEditMessageText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('logs and returns when callback messages are unavailable', async () => {
    const ctx = {
      callbackQuery: { data: 'profile:view' },
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
    } as unknown as Context;

    await safeEditMessageText(ctx, 'text', {});

    expect(ctx.editMessageText).not.toHaveBeenCalled();
    expect(ctx.answerCallbackQuery).not.toHaveBeenCalled();
  });

  it('edits messages and acknowledges callback queries', async () => {
    const ctx = createContext();

    await safeEditMessageText(ctx, 'text', { parse_mode: 'HTML' });

    expect(ctx.editMessageText).toHaveBeenCalledWith('text', { parse_mode: 'HTML' });
    expect(ctx.answerCallbackQuery).toHaveBeenCalledOnce();
  });

  it('acknowledges unchanged messages without throwing', async () => {
    const ctx = createContext();
    vi.mocked(ctx.editMessageText).mockRejectedValue(new Error('message is not modified'));

    await safeEditMessageText(ctx, 'text', {});

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'bot-server.callback_unchanged:{}',
    });
  });
});

describe('profile callback actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('renders profile view, edit, personal edit, and stats surfaces', async () => {
    const ctx = createContext();

    await handleProfileAction(ctx, user(), ['view']);
    await handleProfileAction(ctx, user(), ['edit']);
    await handleProfileAction(ctx, user(), ['edit', 'personal']);
    await handleProfileAction(ctx, user(), ['stats']);

    expect(ctx.editMessageText).toHaveBeenCalledTimes(4);
  });

  it('prompts for basic and personal profile input actions', async () => {
    const ctx = createContext();

    await handleProfileAction(ctx, user(), ['edit', 'name']);
    await handleProfileAction(ctx, user(), ['edit', 'national_id']);

    expect(ctx.editMessageText).toHaveBeenNthCalledWith(
      1,
      'user-management.profile.prompt.name:{}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
    expect(ctx.editMessageText).toHaveBeenNthCalledWith(
      2,
      'user-management.profile.prompt.national_id:{}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('answers unknown profile actions', async () => {
    const ctx = createContext();

    await handleProfileAction(ctx, user(), ['unknown']);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
      'user-management.errors.unknown_action:{}',
    );
  });
});

describe('users callback actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('rejects non-admin users before management actions', async () => {
    const ctx = createContext();

    await handleUsersAction(ctx, user({ role: RoleEnum.USER }), ['list']);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.unauthorized:{}');
    expect(getUserService).not.toHaveBeenCalled();
  });

  it('renders user lists and reports fetch errors', async () => {
    const ctx = createContext();
    const searchUsers = vi
      .fn()
      .mockResolvedValueOnce(ok([user(), user({ id: 'user-2', username: undefined })]))
      .mockResolvedValueOnce(err(new AppError('user-management.fetch_failed')));
    vi.mocked(getUserService).mockReturnValue({ searchUsers } as never);

    await handleUsersAction(ctx, user(), ['list']);
    await handleUsersAction(ctx, user(), ['list']);

    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.fetch_error:{}');
  });

  it('handles user search, view, role change, and unknown actions', async () => {
    const ctx = createContext();
    const service = {
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: user({ id: 'user-2', role: RoleEnum.USER }),
      }),
      updateRole: vi.fn().mockResolvedValue(ok(undefined)),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);

    await handleUsersAction(ctx, user(), ['search']);
    await handleUsersAction(ctx, user(), ['view', 'user-2']);
    await handleUsersAction(ctx, user(), ['role', 'user-2', 'ADMIN']);
    await handleUsersAction(ctx, user(), ['role-confirm', 'user-2', 'ADMIN']);
    await handleUsersAction(ctx, user(), ['other']);

    expect(ctx.answerCallbackQuery).toHaveBeenNthCalledWith(
      1,
      'user-management.users.search_pending:{}',
    );
    expect(service.getById).toHaveBeenCalledWith('user-2');
    expect(service.updateRole).toHaveBeenCalledWith('user-2', RoleEnum.ADMIN);
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.role.confirm:{"role":"user-management.role.ADMIN:{}"}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.role.success:{}');
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
      'user-management.errors.unknown_action:{}',
    );
  });
});
