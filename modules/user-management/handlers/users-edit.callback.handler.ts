import { InlineKeyboard, type Context } from 'grammy';
import { getI18n } from '../deps.context.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import type { UserInputAction } from './user-state.service.js';
import { setUserInputState } from './user-state.service.js';
import { safeEditMessageText } from './callback-shared.handler.js';

const ADMIN_EDIT_ACTIONS: Record<string, UserInputAction> = {
  name: 'edit_name',
  email: 'edit_email',
  language: 'edit_language',
  national_id: 'edit_national_id',
  mobile: 'edit_mobile',
  birth_date: 'edit_birth_date',
  gender: 'edit_gender',
  governorate: 'edit_governorate',
  country_code: 'edit_country_code',
};

const PROMPT_KEYS: Record<string, string> = {
  edit_name: 'user-management.profile.prompt.name',
  edit_email: 'user-management.profile.prompt.email',
  edit_language: 'user-management.profile.prompt.language',
  edit_national_id: 'user-management.profile.prompt.national_id',
  edit_mobile: 'user-management.profile.prompt.mobile',
  edit_birth_date: 'user-management.profile.prompt.birth_date',
  edit_gender: 'user-management.profile.prompt.gender',
  edit_governorate: 'user-management.profile.prompt.governorate',
  edit_country_code: 'user-management.profile.prompt.country_code',
};

export async function handleUsersEditAction(ctx: Context, params: string[]): Promise<void> {
  const i18n = getI18n();
  const [userId, field] = params;
  if (!userId) {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.invalid_callback'));
    return;
  }

  if (!field) {
    await safeEditMessageText(ctx, i18n.t('user-management.users.edit_prompt'), {
      parse_mode: 'HTML',
      reply_markup: UsersMenuFactory.createUserEdit(userId, i18n),
    });
    return;
  }

  const action = ADMIN_EDIT_ACTIONS[field];
  if (!action) {
    await ctx.answerCallbackQuery(i18n.t('user-management.errors.unknown_action'));
    return;
  }

  await promptAdminUserInput(ctx, userId, action);
}

async function promptAdminUserInput(
  ctx: Context,
  userId: string,
  action: UserInputAction,
): Promise<void> {
  const i18n = getI18n();
  const telegramId = ctx.from!.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;
  await setUserInputState({ telegramId, chatId, action, targetUserId: userId });
  await safeEditMessageText(ctx, i18n.t(PROMPT_KEYS[action]), {
    parse_mode: 'HTML',
    reply_markup: createCancelKeyboard(userId, i18n),
  });
}

function createCancelKeyboard(userId: string, i18n: ReturnType<typeof getI18n>): InlineKeyboard {
  return new InlineKeyboard().text(i18n.t('user-management.common.cancel'), `users:view:${userId}`);
}
