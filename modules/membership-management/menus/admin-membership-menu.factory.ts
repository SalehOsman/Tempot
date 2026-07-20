import { InlineKeyboard } from 'grammy';
import type { MembershipRequest } from '../types/membership-request.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export function createPendingRequestsMenu(
  requests: readonly MembershipRequest[],
  _t: TranslationFn,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const request of requests) {
    keyboard.text(displayRequestLabel(request), `membership:detail:${request.id}`).row();
  }
  return keyboard;
}

export function createReviewActionsMenu(requestId: string, t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('membership-management.admin.approve_button'), `membership:approve:${requestId}`)
    .text(t('membership-management.admin.reject_button'), `membership:reject:${requestId}`)
    .row()
    .text(t('membership-management.admin.back_button'), 'membership:list');
}

export function createBackToListMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard().text(t('membership-management.admin.back_button'), 'membership:list');
}

function displayRequestLabel(request: MembershipRequest): string {
  return request.fullName ?? request.telegramUsername ?? request.telegramId;
}
