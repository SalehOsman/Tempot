import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleTextInput } from '../../handlers/text.handler.js';
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

function user(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'saleh',
    email: 'saleh@example.com',
    language: 'en',
    role: RoleEnum.SUPER_ADMIN,
    createdAt: new Date('2026-06-17T00:00:00.000Z'),
    updatedAt: new Date('2026-06-17T00:00:00.000Z'),
    ...overrides,
  };
}

describe('admin user editing', () => {
  const enforce = vi.fn();
  const publish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    enforce.mockResolvedValue(true);
    publish.mockResolvedValue({ isOk: () => true });
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { metadata: null },
        }),
      },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
      config: {} as never,
    });
  });

  it('should store the selected target user when prompting for admin edits', async () => {
    const ctx = callbackContext('users:edit:user-2:mobile');

    await handleUsersAction(ctx, user(), ['edit', 'user-2', 'mobile']);

    expect(publish).toHaveBeenCalledWith(
      'user-management.state.set',
      expect.objectContaining({
        state: expect.objectContaining({
          action: 'edit_mobile',
          targetUserId: 'user-2',
        }),
      }),
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.profile.prompt.mobile',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should edit the selected target user instead of the acting super admin', async () => {
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: {
            metadata: {
              pendingInputState: {
                action: 'edit_mobile',
                targetUserId: 'user-2',
                timestamp: Date.now(),
              },
            },
          },
        }),
      },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
      config: {} as never,
    });
    const service = {
      getByTelegramId: vi.fn().mockResolvedValue({ isErr: () => false, value: user() }),
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: user({ id: 'user-2', telegramId: '222', role: RoleEnum.USER }),
      }),
      updateMobileNumber: vi.fn().mockResolvedValue(ok(undefined)),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);

    await handleTextInput(textContext('+20 0100-123-4567'));

    expect(enforce).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'manage', subject: 'users' }),
    );
    expect(service.updateMobileNumber).toHaveBeenCalledWith('user-2', '+2001001234567');
    expect(service.updateMobileNumber).not.toHaveBeenCalledWith('user-1', expect.any(String));
    expect(publish).toHaveBeenCalledWith('user-management.user.admin_updated', {
      actorUserId: 'user-1',
      targetUserId: 'user-2',
      action: 'edit_mobile',
      status: 'success',
    });
  });

  it('should publish a test notification request for the selected user', async () => {
    const service = {
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: user({ id: 'user-2', telegramId: '222', role: RoleEnum.USER }),
      }),
    };
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = callbackContext('users:test-notification:user-2');

    await handleUsersAction(ctx, user(), ['test-notification', 'user-2']);

    expect(ctx.api.sendMessage).toHaveBeenCalledWith(
      '222',
      'user-management.users.test_notification_message',
      { parse_mode: 'HTML' },
    );
    expect(publish).toHaveBeenCalledWith(
      'notification-center.notification.test_requested',
      expect.objectContaining({
        telegramId: '222',
        targetUserId: 'user-2',
        requestedByUserId: 'user-1',
      }),
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.test_notification_requested',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should show a diagnostic reason when Telegram rejects a test notification', async () => {
    const logger = createLogger();
    const translate = vi.fn((key: string) => key);
    registerDeps({
      logger,
      i18n: { t: translate },
      eventBus: { publish },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { metadata: null },
        }),
      },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
      config: {} as never,
    });
    const service = {
      getById: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: user({ id: 'user-2', telegramId: '222', role: RoleEnum.USER }),
      }),
    };
    const telegramError = Object.assign(new Error('Telegram rejected sendMessage'), {
      error_code: 403,
      description: 'Forbidden: bot was blocked by the user',
    });
    vi.mocked(getUserService).mockReturnValue(service as never);
    const ctx = callbackContext('users:test-notification:user-2');
    ctx.api.sendMessage = vi.fn().mockRejectedValue(telegramError);

    await handleUsersAction(ctx, user(), ['test-notification', 'user-2']);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'user_test_notification_delivery_failed',
        errorCode: 403,
        error: 'Forbidden: bot was blocked by the user',
      }),
    );
    expect(translate).toHaveBeenCalledWith(
      'user-management.users.test_notification_failed_detail',
      { reason: 'Forbidden: bot was blocked by the user' },
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'user-management.users.test_notification_failed_detail',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });
});

function callbackContext(data: string): Context {
  return {
    callbackQuery: { data, message: { message_id: 10 } },
    from: { id: 123456789 },
    chat: { id: 987654321 },
    api: { sendMessage: vi.fn().mockResolvedValue({ message_id: 20 }) },
    answerCallbackQuery: vi.fn(),
    editMessageText: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function textContext(text: string): Context {
  return {
    message: { text },
    from: { id: 123456789 },
    chat: { id: 987654321 },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}
