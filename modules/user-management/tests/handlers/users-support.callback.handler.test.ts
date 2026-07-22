import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import {
  handleUsersActivityAction,
  handleUsersNotificationsAction,
  handleUsersTestNotificationAction,
} from '../../handlers/users-support.callback.handler.js';
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
    callbackQuery: { data: 'users:test-notification:user-2', message: { message_id: 10 } },
    from: { id: 123456789 },
    chat: { id: 987654321 },
    api: { sendMessage: vi.fn().mockResolvedValue(undefined) },
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
    eventBus: { publish: vi.fn().mockResolvedValue(ok(undefined)) },
    sessionProvider: { getSession: vi.fn().mockResolvedValue(null) },
    settings: { get: vi.fn() },
    authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
    config: {} as never,
  });
  return logger;
}

describe('users support callback actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('renders activity and notification unavailable surfaces for a selected user', async () => {
    const ctx = createContext();

    await handleUsersActivityAction(ctx, 'user-2');
    await handleUsersNotificationsAction(ctx, 'user-2');

    expect(ctx.editMessageText).toHaveBeenNthCalledWith(
      1,
      'user-management.users.activity_unavailable:{}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
    expect(ctx.editMessageText).toHaveBeenNthCalledWith(
      2,
      'user-management.users.notifications_unavailable:{}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('answers invalid support callbacks when the target user id is missing', async () => {
    const ctx = createContext();

    await handleUsersActivityAction(ctx, undefined);
    await handleUsersNotificationsAction(ctx, undefined);
    await handleUsersTestNotificationAction(ctx, user(), undefined);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledTimes(3);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
      'user-management.errors.invalid_callback:{}',
    );
  });

  it('publishes and sends a visible test notification to the target user', async () => {
    const ctx = createContext();
    const publish = vi.fn().mockResolvedValue(ok(undefined));
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish },
      sessionProvider: { getSession: vi.fn().mockResolvedValue(null) },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
      config: {} as never,
    });
    vi.mocked(getUserService).mockReturnValue({
      getById: vi.fn().mockResolvedValue(ok(user({ id: 'user-2', telegramId: '222' }))),
    } as never);

    await handleUsersTestNotificationAction(ctx, user({ id: 'admin-1' }), 'user-2');

    expect(publish).toHaveBeenCalledWith(
      'notification-center.notification.test_requested',
      expect.objectContaining({
        requestedByUserId: 'admin-1',
        targetUserId: 'user-2',
        telegramId: '222',
      }),
    );
    expect(ctx.api.sendMessage).toHaveBeenCalledWith(
      '222',
      'user-management.users.test_notification_message',
      { parse_mode: 'HTML' },
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.test_notification_requested',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('renders delivery failure details for failed test notifications', async () => {
    const logger = registerTestDeps();
    const ctx = createContext();
    vi.mocked(ctx.api.sendMessage).mockRejectedValue({
      error_code: 403,
      description: 'bot was blocked by the user',
    });
    vi.mocked(getUserService).mockReturnValue({
      getById: vi.fn().mockResolvedValue(ok(user({ id: 'user-2', telegramId: '222' }))),
    } as never);

    await handleUsersTestNotificationAction(ctx, user({ id: 'admin-1' }), 'user-2');

    expect(logger.warn).toHaveBeenCalledWith({
      msg: 'user_test_notification_delivery_failed',
      errorCode: 403,
      error: 'bot was blocked by the user',
    });
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.test_notification_failed_detail:{"reason":"bot was blocked by the user"}',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });
});
