import { Context } from 'grammy';
import { getUserService } from '../services/user-service.context.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import { getI18n, getLogger } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import { handleUsersAction } from './users.callback.handler.js';
import { handleProfileAction } from './profile.callback.handler.js';
import { safeEditMessageText } from './callback-shared.handler.js';

function parseCallbackData(data: string): { action: string; params: string[] } {
  const [action, ...params] = data.split(':');
  return { action, params };
}

async function fetchUser(telegramId: string): Promise<UserProfile | null> {
  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) return null;
  return userResult.value;
}

async function handleCallbackQuery(ctx: Context): Promise<void> {
  const log = getLogger().child({ handler: 'callback' });
  const i18n = getI18n();
  try {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery?.data) {
      await ctx.answerCallbackQuery(i18n.t('user-management.errors.invalid_callback'));
      return;
    }

    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.answerCallbackQuery(i18n.t('user-management.errors.no_user'));
      return;
    }

    const telegramId = telegramUser.id.toString();
    const { action, params } = parseCallbackData(callbackQuery.data);

    log.info({ msg: 'callback_received', telegramId, action, params });

    const user = await fetchUser(telegramId);
    if (!user) {
      await ctx.answerCallbackQuery(i18n.t('user-management.profile.not_found'));
      return;
    }

    await dispatchCallbackAction(ctx, user, { action, params });
  } catch (error) {
    log.error({ msg: 'callback_error', error: String(error) });
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.callback_failed'));
  }
}

async function dispatchCallbackAction(
  ctx: Context,
  user: UserProfile,
  payload: { action: string; params: string[] },
): Promise<void> {
  const i18n = getI18n();
  const { action, params } = payload;
  switch (action) {
    case 'menu':
      await handleMenuAction(ctx, user, params);
      break;
    case 'profile':
      await handleProfileAction(ctx, user, params);
      break;
    case 'users':
      await handleUsersAction(ctx, user, params);
      break;
    default:
      await ctx.answerCallbackQuery(i18n.t('user-management.errors.unknown_action'));
  }
}

async function handleMenuAction(ctx: Context, user: UserProfile, params: string[]): Promise<void> {
  const i18n = getI18n();
  if (params[0] === 'main') {
    const msg = i18n.t('user-management.menu.welcome', {
      name: user.username ?? user.telegramId,
      role: i18n.t(`user-management.role.${user.role}`),
      language: i18n.t(`user-management.language.${user.language}`),
    });
    await safeEditMessageText(ctx, msg, {
      parse_mode: 'HTML',
      reply_markup: MainMenuFactory.create(user, i18n),
    });
  } else {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.unknown_action'));
  }
}

export { handleCallbackQuery };
