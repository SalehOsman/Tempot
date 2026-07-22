import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleUsersAction } from '../../handlers/users.callback.handler.js';
import { getUserService } from '../../services/user-service.context.js';
import type { UserProfile } from '../../types/index.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

function createContext(): Context {
  return {
    callbackQuery: { data: 'users:block:user-2', message: { message_id: 10 } },
    from: { id: 123456789 },
    chat: { id: 123456789 },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
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

function user(role: UserProfile['role']): UserProfile {
  return {
    id: 'admin-1',
    telegramId: '123456789',
    username: 'admin',
    language: 'en',
    role,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-23T00:00:00.000Z'),
    updatedAt: new Date('2026-07-23T00:00:00.000Z'),
  };
}

describe('users block callback actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
      config: {} as never,
    });
  });

  it('should ask super admins to confirm blocking a selected user', async () => {
    const service = { blockUser: vi.fn() };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext();

    await handleUsersAction(ctx, user(RoleEnum.SUPER_ADMIN), ['block', 'user-2']);

    expect(service.blockUser).not.toHaveBeenCalled();
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.block.confirm',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should block selected users after super admin confirmation', async () => {
    const target = user(RoleEnum.USER);
    const service = {
      blockUser: vi.fn().mockResolvedValue(ok(undefined)),
      getById: vi.fn().mockResolvedValue(ok({ ...target, id: 'user-2', status: 'BANNED' })),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext();

    await handleUsersAction(ctx, user(RoleEnum.SUPER_ADMIN), ['block-confirm', 'user-2']);

    expect(service.blockUser).toHaveBeenCalledWith('user-2');
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.block.success');
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
  });

  it('should unblock selected users after super admin confirmation', async () => {
    const target = user(RoleEnum.USER);
    const service = {
      unblockUser: vi.fn().mockResolvedValue(ok(undefined)),
      getById: vi.fn().mockResolvedValue(ok({ ...target, id: 'user-2', status: 'ACTIVE' })),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext();

    await handleUsersAction(ctx, user(RoleEnum.SUPER_ADMIN), ['unblock-confirm', 'user-2']);

    expect(service.unblockUser).toHaveBeenCalledWith('user-2');
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.unblock.success');
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
  });

  it('should restrict unblocking to super admins', async () => {
    const service = { unblockUser: vi.fn() };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext();

    await handleUsersAction(ctx, user(RoleEnum.ADMIN), ['unblock-confirm', 'user-2']);

    expect(service.unblockUser).not.toHaveBeenCalled();
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.unauthorized');
  });

  it('should restrict blocking to super admins', async () => {
    const service = { blockUser: vi.fn() };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = createContext();

    await handleUsersAction(ctx, user(RoleEnum.ADMIN), ['block-confirm', 'user-2']);

    expect(service.blockUser).not.toHaveBeenCalled();
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('user-management.users.unauthorized');
  });
});
