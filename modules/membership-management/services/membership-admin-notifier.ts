import type { InlineKeyboard } from 'grammy';
import { createReviewActionsMenu } from '../menus/admin-membership-menu.factory.js';
import type { MembershipAdminNotifier } from '../types/module-deps.types.js';
import type { MembershipRequest } from '../types/membership-request.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

interface TelegramBotApi {
  sendMessage(
    chatId: number,
    text: string,
    options: { parse_mode: 'HTML'; reply_markup: InlineKeyboard },
  ): Promise<unknown>;
}

interface MembershipAdminNotifierDeps {
  api: TelegramBotApi;
  logger: { warn: (data: Record<string, unknown>) => void };
  superAdminIds: readonly number[];
  t: TranslationFn;
}

export function createMembershipAdminNotifier(
  deps: MembershipAdminNotifierDeps,
): MembershipAdminNotifier {
  return {
    notifySubmitted: async (request) => {
      await Promise.all(deps.superAdminIds.map((adminId) => notifyAdmin(deps, adminId, request)));
    },
  };
}

async function notifyAdmin(
  deps: MembershipAdminNotifierDeps,
  adminId: number,
  request: MembershipRequest,
): Promise<void> {
  try {
    await deps.api.sendMessage(adminId, createNotificationBody(deps.t, request), {
      parse_mode: 'HTML',
      reply_markup: createReviewActionsMenu(request.id, deps.t),
    });
  } catch (error: unknown) {
    deps.logger.warn({
      msg: 'membership-management.admin_notification_failed',
      adminId,
      requestId: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function createNotificationBody(t: TranslationFn, request: MembershipRequest): string {
  return t('membership-management.admin.notification.submitted', {
    telegramId: request.telegramId,
    username: request.telegramUsername ?? '-',
    fullName: request.fullName ?? '-',
    nickname: request.nickname ?? '-',
    mobileNumber: request.mobileNumber ?? '-',
    requestMessage: request.requestMessage ?? '-',
    requestedAt: request.requestedAt.toISOString(),
  });
}
