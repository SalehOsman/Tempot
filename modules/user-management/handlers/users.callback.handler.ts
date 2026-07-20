import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { getUserService } from '../services/user-service.context.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { getI18n } from '../deps.context.js';
import { buildUserDetailMessage } from '../services/user-display.service.js';
import type { UserProfile } from '../types/index.js';
import { safeEditMessageText } from './callback-shared.handler.js';
import { handleUsersEditAction } from './users-edit.callback.handler.js';
import {
  handleUsersActivityAction,
  handleUsersNotificationsAction,
  handleUsersTestNotificationAction,
} from './users-support.callback.handler.js';

const MANAGEABLE_ROLES: Record<string, RoleEnum> = {
  USER: RoleEnum.USER,
  ADMIN: RoleEnum.ADMIN,
  SUPER_ADMIN: RoleEnum.SUPER_ADMIN,
};

export async function handleUsersAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
  const i18n = getI18n();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    await ctx.answerCallbackQuery(i18n.t('user-management.users.unauthorized'));
    return;
  }

  const subAction = params[0];

  switch (subAction) {
    case 'list':
      await handleUsersListAction(ctx);
      break;
    case 'search':
      await ctx.answerCallbackQuery(i18n.t('user-management.users.search_pending'));
      break;
    case 'view':
      await handleUsersViewAction(ctx, params[1]);
      break;
    case 'edit':
      await handleUsersEditAction(ctx, params.slice(1));
      break;
    case 'roles':
      await handleUsersRoleMenuAction(ctx, params[1]);
      break;
    case 'role':
      await handleUsersRoleSelectionAction(ctx, params[1], params[2]);
      break;
    case 'role-confirm':
      await handleUsersRoleConfirmAction(ctx, params[1], params[2]);
      break;
    case 'role-cancel':
      await handleUsersViewAction(ctx, params[1]);
      break;
    case 'activity':
      await handleUsersActivityAction(ctx, params[1]);
      break;
    case 'notifications':
      await handleUsersNotificationsAction(ctx, params[1]);
      break;
    case 'test-notification':
      await handleUsersTestNotificationAction(ctx, user, params[1]);
      break;
    default:
      await ctx.answerCallbackQuery(i18n.t('user-management.errors.unknown_action'));
  }
}

async function handleUsersListAction(ctx: Context): Promise<void> {
  const i18n = getI18n();
  const usersResult = await getUserService().searchUsers('', 0, 10);

  if (usersResult.isErr()) {
    await ctx.answerCallbackQuery(i18n.t('user-management.users.fetch_error'));
    return;
  }

  const users = usersResult.value;
  const listKeyboard = UsersMenuFactory.createList(users, i18n);
  const usersMessage = formatUsersList(users, i18n);

  await safeEditMessageText(ctx, usersMessage, {
    parse_mode: 'HTML',
    reply_markup: listKeyboard,
  });
}

async function handleUsersViewAction(ctx: Context, userId: string | undefined): Promise<void> {
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

  const targetUser = userResult.value;
  await safeEditMessageText(ctx, buildUserDetailMessage(targetUser, i18n), {
    parse_mode: 'HTML',
    reply_markup: UsersMenuFactory.createUserDetail(targetUser, i18n),
  });
}

async function handleUsersRoleMenuAction(ctx: Context, userId: string | undefined): Promise<void> {
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

  const targetUser = userResult.value;
  await safeEditMessageText(ctx, i18n.t('user-management.users.role.change'), {
    parse_mode: 'HTML',
    reply_markup: UsersMenuFactory.createRoleChange(targetUser, i18n),
  });
}

async function handleUsersRoleSelectionAction(
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

async function handleUsersRoleConfirmAction(
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

  const updateResult = await getUserService().updateRole(userId, newRole);
  if (updateResult.isErr()) {
    await ctx.answerCallbackQuery(roleErrorMessage(updateResult.error.code, i18n));
    return;
  }

  await ctx.answerCallbackQuery(i18n.t('user-management.users.role.success'));
  await handleUsersViewAction(ctx, userId);
}

function roleErrorMessage(errorCode: string, i18n: ReturnType<typeof getI18n>): string {
  if (errorCode === 'user-management.users.role.last_super_admin') {
    return i18n.t('user-management.users.role.last_super_admin');
  }
  return i18n.t('user-management.users.role.error');
}

function formatUsersList(users: UserProfile[], i18n: ReturnType<typeof getI18n>): string {
  if (users.length === 0) {
    return i18n.t('user-management.users.not_found');
  }

  const rows = users
    .slice(0, 5)
    .map(
      (user, index) =>
        `${index + 1}. ${user.username || i18n.t('user-management.common.undefined')} (${user.role})`,
    )
    .join('\n');

  const extra =
    users.length > 5
      ? `\n${i18n.t('user-management.users.more', { count: users.length - 5 })}`
      : '';

  return `${i18n.t('user-management.users.list_header', { count: users.length })}\n\n${rows}${extra}`;
}
