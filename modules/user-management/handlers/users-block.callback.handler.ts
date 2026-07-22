import { RoleEnum } from '@tempot/auth-core';
import type { Context } from 'grammy';
import { getDeps, getI18n } from '../deps.context.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { saveProfileSession } from '../services/session-language-sync.service.js';
import { getUserService } from '../services/user-service.context.js';
import type { UserProfile } from '../types/index.js';
import { safeEditMessageText } from './callback-shared.handler.js';

export async function handleUsersBlockPromptAction(
  ctx: Context,
  actor: UserProfile,
  userId: string | undefined,
): Promise<void> {
  const i18n = getI18n();
  if (!isSuperAdmin(actor)) return answerUnauthorized(ctx);
  if (!userId) return answerInvalidCallback(ctx);

  await safeEditMessageText(ctx, i18n.t('user-management.users.block.confirm'), {
    parse_mode: 'HTML',
    reply_markup: UsersMenuFactory.createBlockConfirm(userId, i18n),
  });
}

export async function handleUsersBlockConfirmAction(
  ctx: Context,
  actor: UserProfile,
  userId: string | undefined,
): Promise<boolean> {
  const i18n = getI18n();
  if (!isSuperAdmin(actor)) {
    await answerUnauthorized(ctx);
    return false;
  }
  if (!userId) {
    await answerInvalidCallback(ctx);
    return false;
  }

  const result = await getUserService().blockUser(userId);
  if (result.isErr()) {
    await ctx.answerCallbackQuery(blockErrorMessage(result.error.code));
    return false;
  }

  await refreshUserSession(userId);
  await ctx.answerCallbackQuery(i18n.t('user-management.users.block.success'));
  return true;
}

export async function handleUsersUnblockPromptAction(
  ctx: Context,
  actor: UserProfile,
  userId: string | undefined,
): Promise<void> {
  const i18n = getI18n();
  if (!isSuperAdmin(actor)) return answerUnauthorized(ctx);
  if (!userId) return answerInvalidCallback(ctx);

  await safeEditMessageText(ctx, i18n.t('user-management.users.unblock.confirm'), {
    parse_mode: 'HTML',
    reply_markup: UsersMenuFactory.createUnblockConfirm(userId, i18n),
  });
}

export async function handleUsersUnblockConfirmAction(
  ctx: Context,
  actor: UserProfile,
  userId: string | undefined,
): Promise<boolean> {
  const i18n = getI18n();
  if (!isSuperAdmin(actor)) {
    await answerUnauthorized(ctx);
    return false;
  }
  if (!userId) {
    await answerInvalidCallback(ctx);
    return false;
  }

  const result = await getUserService().unblockUser(userId);
  if (result.isErr()) {
    await ctx.answerCallbackQuery(i18n.t('user-management.users.unblock.error'));
    return false;
  }

  await refreshUserSession(userId);
  await ctx.answerCallbackQuery(i18n.t('user-management.users.unblock.success'));
  return true;
}

async function refreshUserSession(userId: string): Promise<void> {
  const profileResult = await getUserService().getById(userId);
  if (profileResult.isErr()) return;
  await saveProfileSession({
    sessionProvider: getDeps().sessionProvider,
    user: profileResult.value,
    chatId: profileResult.value.telegramId,
  });
}

function isSuperAdmin(actor: UserProfile): boolean {
  return actor.role === RoleEnum.SUPER_ADMIN;
}

async function answerUnauthorized(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery(getI18n().t('user-management.users.unauthorized'));
}

async function answerInvalidCallback(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery(getI18n().t('user-management.errors.invalid_callback'));
}

function blockErrorMessage(errorCode: string): string {
  const i18n = getI18n();
  if (errorCode === 'user-management.users.role.last_super_admin') {
    return i18n.t('user-management.users.role.last_super_admin');
  }
  return i18n.t('user-management.users.block.error');
}
