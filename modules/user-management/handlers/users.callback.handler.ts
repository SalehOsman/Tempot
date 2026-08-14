import type { Context } from 'grammy';
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
import {
  handleUsersBlockConfirmAction,
  handleUsersBlockPromptAction,
  handleUsersUnblockConfirmAction,
  handleUsersUnblockPromptAction,
} from './users-block.callback.handler.js';
import {
  handleUsersRoleConfirmAction,
  handleUsersRoleMenuAction,
  handleUsersRoleSelectionAction,
} from './users-role.callback.handler.js';

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

  await dispatchUsersAction(ctx, user, params);
}

async function dispatchUsersAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
  if (await handlePrimaryUsersAction(ctx, params)) return;
  if (await handleSupportUsersAction(ctx, user, params)) return;
  await ctx.answerCallbackQuery(getI18n().t('user-management.errors.unknown_action'));
}

async function handlePrimaryUsersAction(ctx: Context, params: string[]): Promise<boolean> {
  switch (params[0]) {
    case 'list':
      await handleUsersListAction(ctx);
      return true;
    case 'search':
      await ctx.answerCallbackQuery(getI18n().t('user-management.users.search_pending'));
      return true;
    case 'view':
      await handleUsersViewAction(ctx, params[1]);
      return true;
    case 'edit':
      await handleUsersEditAction(ctx, params.slice(1));
      return true;
    case 'roles':
      await handleUsersRoleMenuAction(ctx, params[1]);
      return true;
    case 'role':
      await handleUsersRoleSelectionAction(ctx, params[1], params[2]);
      return true;
    case 'role-confirm':
      if (await handleUsersRoleConfirmAction(ctx, params[1], params[2])) {
        await handleUsersViewAction(ctx, params[1]);
      }
      return true;
    case 'role-cancel':
      await handleUsersViewAction(ctx, params[1]);
      return true;
    default:
      return false;
  }
}

async function handleSupportUsersAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<boolean> {
  switch (params[0]) {
    case 'activity':
      await handleUsersActivityAction(ctx, params[1]);
      return true;
    case 'notifications':
      await handleUsersNotificationsAction(ctx, params[1]);
      return true;
    case 'test-notification':
      await handleUsersTestNotificationAction(ctx, user, params[1]);
      return true;
    case 'block':
      await handleUsersBlockPromptAction(ctx, user, params[1]);
      return true;
    case 'block-confirm':
      if (await handleUsersBlockConfirmAction(ctx, user, params[1])) {
        await handleUsersViewAction(ctx, params[1]);
      }
      return true;
    case 'block-cancel':
      await handleUsersViewAction(ctx, params[1]);
      return true;
    case 'unblock':
      await handleUsersUnblockPromptAction(ctx, user, params[1]);
      return true;
    case 'unblock-confirm':
      if (await handleUsersUnblockConfirmAction(ctx, user, params[1])) {
        await handleUsersViewAction(ctx, params[1]);
      }
      return true;
    case 'unblock-cancel':
      await handleUsersViewAction(ctx, params[1]);
      return true;
    default:
      return false;
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
