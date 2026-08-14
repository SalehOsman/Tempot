import { InlineKeyboard, type Context } from 'grammy';
import { randomUUID } from 'node:crypto';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import type { UserProfile } from '../types/index.js';
import { safeEditMessageText } from './callback-shared.handler.js';

export async function handleUsersActivityAction(
  ctx: Context,
  userId: string | undefined,
): Promise<void> {
  await renderSupportFallback(ctx, userId, 'user-management.users.activity_unavailable');
}

export async function handleUsersNotificationsAction(
  ctx: Context,
  userId: string | undefined,
): Promise<void> {
  await renderSupportFallback(ctx, userId, 'user-management.users.notifications_unavailable');
}

export async function handleUsersTestNotificationAction(
  ctx: Context,
  actor: UserProfile,
  userId: string | undefined,
): Promise<void> {
  const i18n = getI18n();
  if (!userId) {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.invalid_callback'));
    return;
  }

  const targetResult = await getUserService().getById(userId);
  if (targetResult.isErr()) {
    await ctx.answerCallbackQuery(i18n.t('user-management.profile.not_found'));
    return;
  }

  const reference = createTestReference();
  const targetUser = targetResult.value;
  await getDeps().eventBus.publish('notification-center.notification.test_requested', {
    reference,
    requestedAt: new Date().toISOString(),
    requestedByUserId: actor.id,
    targetUserId: userId,
    telegramId: targetUser.telegramId,
  });
  const delivery = await sendTestNotification(ctx, targetUser.telegramId);
  if (!delivery.delivered) {
    await safeEditMessageText(
      ctx,
      i18n.t('user-management.users.test_notification_failed_detail', {
        reason: delivery.reason,
      }),
      {
        parse_mode: 'HTML',
        reply_markup: createBackKeyboard(userId),
      },
    );
    return;
  }
  await safeEditMessageText(ctx, i18n.t('user-management.users.test_notification_requested'), {
    parse_mode: 'HTML',
    reply_markup: createBackKeyboard(userId),
  });
}

async function renderSupportFallback(
  ctx: Context,
  userId: string | undefined,
  key: string,
): Promise<void> {
  const i18n = getI18n();
  if (!userId) {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.invalid_callback'));
    return;
  }
  await safeEditMessageText(ctx, i18n.t(key), {
    parse_mode: 'HTML',
    reply_markup: createBackKeyboard(userId),
  });
}

function createBackKeyboard(userId: string): InlineKeyboard {
  const i18n = getI18n();
  return new InlineKeyboard().text(i18n.t('user-management.menu.back'), `users:view:${userId}`);
}

function createTestReference(): string {
  return `UMT-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

interface TestNotificationDeliveryResult {
  delivered: boolean;
  reason?: string;
}

async function sendTestNotification(
  ctx: Context,
  telegramId: string,
): Promise<TestNotificationDeliveryResult> {
  const i18n = getI18n();
  try {
    await ctx.api.sendMessage(
      telegramId,
      i18n.t('user-management.users.test_notification_message'),
      {
        parse_mode: 'HTML',
      },
    );
    return { delivered: true };
  } catch (error) {
    const details = extractTelegramFailure(error);
    getLogger().warn({
      msg: 'user_test_notification_delivery_failed',
      errorCode: details.errorCode,
      error: details.reason,
    });
    return { delivered: false, reason: details.reason };
  }
}

function extractTelegramFailure(error: unknown): { errorCode?: number; reason: string } {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const description = record['description'];
    const errorCode = record['error_code'];
    return {
      errorCode: typeof errorCode === 'number' ? errorCode : undefined,
      reason: typeof description === 'string' ? description : extractErrorMessage(error),
    };
  }
  return { reason: extractErrorMessage(error) };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
