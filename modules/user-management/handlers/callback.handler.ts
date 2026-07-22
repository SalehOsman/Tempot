import { Context, type NextFunction } from 'grammy';
import { getUserService } from '../services/user-service.context.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import { handleUsersAction } from './users.callback.handler.js';
import { handleProfileAction } from './profile.callback.handler.js';
import { safeEditMessageText } from './callback-shared.handler.js';
import type { ModuleAuthorizationPolicy } from '../types/module-deps.types.js';
import { abilityTokensFromContext } from '../services/ability-token.service.js';

function parseCallbackData(data: string): { action: string; params: string[] } {
  const [action, ...params] = data.split(':');
  return { action, params };
}

const noopNext: NextFunction = () => Promise.resolve();
const USER_MANAGEMENT_ACTIONS = new Set(['menu', 'profile', 'users']);

async function fetchUser(telegramId: string): Promise<UserProfile | null> {
  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) return null;
  return userResult.value;
}

async function handleCallbackQuery(ctx: Context, next: NextFunction = noopNext): Promise<void> {
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
    if (!USER_MANAGEMENT_ACTIONS.has(action)) {
      await next();
      return;
    }
    const policy = resolveAuthorizationPolicy(action, params);
    if (!(await getDeps().authorization.enforce(ctx, policy))) return;

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

function resolveAuthorizationPolicy(action: string, params: string[]): ModuleAuthorizationPolicy {
  if (action === 'menu') return createPolicy('bootstrap', 'read', 'bootstrap');
  if (action === 'users' && isRoleManagementAction(params)) {
    return createPolicy('protected', 'manage', 'roles');
  }
  if (action === 'users') return createPolicy('protected', 'manage', 'users');
  if (params.join(':') === 'edit:role') {
    return createPolicy('protected', 'manage', 'roles');
  }
  if (params[0] === 'edit') return createPolicy('protected', 'update', 'profile');
  return createPolicy('protected', 'read', 'profile');
}

function isRoleManagementAction(params: string[]): boolean {
  return [
    'roles',
    'role',
    'role-confirm',
    'block',
    'block-confirm',
    'block-cancel',
    'unblock',
    'unblock-confirm',
    'unblock-cancel',
  ].includes(params[0] ?? '');
}

function createPolicy(
  classification: ModuleAuthorizationPolicy['classification'],
  action: string,
  subject: string,
): ModuleAuthorizationPolicy {
  return { module: 'user-management', classification, action, subject };
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
    const navigation = getDeps().navigation;
    const menuEntries =
      navigation?.getVisibleMainMenuItems?.({
        role: user.role,
        abilities: abilityTokensFromContext(ctx),
      }) ??
      navigation?.getMainMenuItems(user.role) ??
      [];
    const msg = i18n.t('user-management.menu.welcome', {
      name: user.username ?? user.telegramId,
      role: i18n.t(`user-management.role.${user.role}`),
      language: i18n.t(`user-management.language.${user.language}`),
    });
    await safeEditMessageText(ctx, msg, {
      parse_mode: 'HTML',
      reply_markup: MainMenuFactory.create(user, i18n, menuEntries),
    });
  } else {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.unknown_action'));
  }
}

export { handleCallbackQuery };
