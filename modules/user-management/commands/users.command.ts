/**
 * /users command — قائمة المستخدمين (ADMIN / SUPER_ADMIN فقط)
 *
 * إصلاحات مطبقة:
 * 1. CASL ability بدلاً من فحص role يدوي
 * 2. كل النصوص من i18n
 * 3. logger من deps.context
 */

import type { Context } from 'grammy';
import { getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import { canDo } from '../abilities.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import type { SessionUser } from '@tempot/auth-core';
import type { UserProfile } from '../types/index.js';

async function validateUserAccess(
  ctx: Context,
  telegramId: string,
): Promise<{ user: UserProfile; sessionUser: SessionUser } | null> {
  const log = getLogger().child({ command: 'users' });
  const i18n = getI18n();

  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) {
    log.warn({ msg: 'users_command_not_found', telegramId, errorCode: userResult.error.code });
    await ctx.reply(i18n.t('user-management.profile.not_found'));
    return null;
  }

  const user = userResult.value;
  const sessionUser: SessionUser = { id: user.id, role: user.role };

  if (!canDo(sessionUser, 'manage', 'users')) {
    log.warn({ msg: 'users_command_forbidden', userId: user.id, role: user.role });
    await ctx.reply(i18n.t('user-management.users.unauthorized'));
    return null;
  }

  return { user, sessionUser };
}

function formatUsersList(users: UserProfile[], i18n: ReturnType<typeof getI18n>): string {
  if (users.length === 0) {
    return i18n.t('user-management.users.not_found');
  }

  const rows = users
    .slice(0, 5)
    .map(
      (u, index) =>
        `${index + 1}. ${u.username ?? i18n.t('user-management.common.undefined')} (${i18n.t(`user-management.role.${u.role}`)})`,
    )
    .join('\n');

  const extra =
    users.length > 5
      ? `\n${i18n.t('user-management.users.more', { count: users.length - 5 })}`
      : '';

  return i18n.t('user-management.users.list_header', { count: users.length }) + '\n\n' + rows + extra;
}

export async function usersCommand(ctx: Context): Promise<void> {
  const log = getLogger().child({ command: 'users' });
  const i18n = getI18n();

  const telegramUser = ctx.from;
  if (!telegramUser) {
    log.warn({ msg: 'users_command_no_user' });
    await ctx.reply(i18n.t('user-management.errors.no_user'));
    return;
  }

  const telegramId = telegramUser.id.toString();
  log.info({ msg: 'users_command', telegramId });

  const accessData = await validateUserAccess(ctx, telegramId);
  if (!accessData) return;

  const usersResult = await getUserService().searchUsers('', 0, 10);
  if (usersResult.isErr()) {
    log.error({ msg: 'users_command_fetch_error', errorCode: usersResult.error.code });
    await ctx.reply(i18n.t('user-management.users.fetch_error'));
    return;
  }

  const users = usersResult.value;
  const keyboard = UsersMenuFactory.createList();
  const message = formatUsersList(users, i18n);

  await ctx.reply(message, { parse_mode: 'HTML', reply_markup: keyboard });
  log.info({ msg: 'users_command_ok', count: users.length });
}
