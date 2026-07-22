import { RoleEnum } from '@tempot/auth-core';
import type { Context } from 'grammy';
import { getI18n } from '../deps.context.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { getUserService } from '../services/user-service.context.js';
import { safeEditMessageText } from './callback-shared.handler.js';

const MANAGEABLE_ROLES: Record<string, RoleEnum> = {
  GUEST: RoleEnum.GUEST,
  USER: RoleEnum.USER,
  ADMIN: RoleEnum.ADMIN,
  SUPER_ADMIN: RoleEnum.SUPER_ADMIN,
};

export async function handleUsersRoleMenuAction(
  ctx: Context,
  userId: string | undefined,
): Promise<void> {
  const i18n = getI18n();
  if (!userId) {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.invalid_callback'));
    return;
  }

  const userResult = await getUserService().getById(userId);
  if (userResult.isErr()) {
    await ctx.answerCallbackQuery(i18n.t('user-management.profile.not_found'));
    return;
  }

  await safeEditMessageText(ctx, i18n.t('user-management.users.role.change'), {
    parse_mode: 'HTML',
    reply_markup: UsersMenuFactory.createRoleChange(userResult.value, i18n),
  });
}

export async function handleUsersRoleSelectionAction(
  ctx: Context,
  userId: string | undefined,
  role: string | undefined,
): Promise<void> {
  const i18n = getI18n();
  const newRole = role ? MANAGEABLE_ROLES[role] : undefined;
  if (!userId || !newRole) {
    await ctx.answerCallbackQuery(i18n.t('user-management.validation.role.invalid'));
    return;
  }

  await safeEditMessageText(
    ctx,
    i18n.t('user-management.users.role.confirm', {
      role: i18n.t(`user-management.role.${newRole}`),
    }),
    {
      parse_mode: 'HTML',
      reply_markup: UsersMenuFactory.createRoleConfirm(userId, newRole, i18n),
    },
  );
}

export async function handleUsersRoleConfirmAction(
  ctx: Context,
  userId: string | undefined,
  role: string | undefined,
): Promise<boolean> {
  const i18n = getI18n();
  const newRole = role ? MANAGEABLE_ROLES[role] : undefined;
  if (!userId || !newRole) {
    await ctx.answerCallbackQuery(i18n.t('user-management.validation.role.invalid'));
    return false;
  }

  const updateResult = await getUserService().updateRole(userId, newRole);
  if (updateResult.isErr()) {
    await ctx.answerCallbackQuery(roleErrorMessage(updateResult.error.code));
    return false;
  }

  await ctx.answerCallbackQuery(i18n.t('user-management.users.role.success'));
  return true;
}

function roleErrorMessage(errorCode: string): string {
  const i18n = getI18n();
  if (errorCode === 'user-management.users.role.last_super_admin') {
    return i18n.t('user-management.users.role.last_super_admin');
  }
  return i18n.t('user-management.users.role.error');
}
