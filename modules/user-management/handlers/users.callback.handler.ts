import { Context } from 'grammy';
import { getUserService } from '../services/user-service.context.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { getI18n } from '../deps.context.js';
import { UserProfile } from '../types/index.js';

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
      await ctx.answerCallbackQuery(
        i18n.t('user-management.users.view_pending', { id: params[1] }),
      );
      break;
    case 'role':
      await ctx.answerCallbackQuery(
        i18n.t('user-management.users.role_pending', { id: params[1], role: params[2] }),
      );
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
  const listKeyboard = UsersMenuFactory.createList(i18n);
  const usersMessage = formatUsersList(users, i18n);

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(usersMessage, {
      parse_mode: 'HTML',
      reply_markup: listKeyboard,
    });
  }
  await ctx.answerCallbackQuery();
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
