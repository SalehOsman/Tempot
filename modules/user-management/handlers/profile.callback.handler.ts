import { Context, InlineKeyboard } from 'grammy';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';
import { getI18n } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import { setUserInputState } from './user-state.service.js';
import { buildProfileMessage } from '../commands/profile.command.js';
import { safeEditMessageText } from './callback-shared.handler.js';

const BASIC_PROMPTS = ['edit:name', 'edit:email', 'edit:language', 'edit:role'];
const PERSONAL_PROMPTS = [
  'edit:national_id',
  'edit:mobile',
  'edit:birth_date',
  'edit:gender',
  'edit:governorate',
  'edit:country_code',
];

const PROMPT_KEYS: Record<string, string> = {
  edit_name: 'user-management.profile.prompt.name',
  edit_email: 'user-management.profile.prompt.email',
  edit_language: 'user-management.profile.prompt.language',
  edit_role: 'user-management.profile.prompt.role',
  edit_national_id: 'user-management.profile.prompt.national_id',
  edit_mobile: 'user-management.profile.prompt.mobile',
  edit_birth_date: 'user-management.profile.prompt.birth_date',
  edit_gender: 'user-management.profile.prompt.gender',
  edit_governorate: 'user-management.profile.prompt.governorate',
  edit_country_code: 'user-management.profile.prompt.country_code',
};

async function promptInput(ctx: Context, action: string, backCallback: string): Promise<void> {
  const i18n = getI18n();
  const telegramId = ctx.from!.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  await setUserInputState(telegramId, chatId, action as Parameters<typeof setUserInputState>[2]);

  const promptText = i18n.t(PROMPT_KEYS[action] ?? 'user-management.profile.prompt.generic');
  const keyboard = new InlineKeyboard().text('❌ إلغاء', backCallback);

  await safeEditMessageText(ctx, promptText, { parse_mode: 'HTML', reply_markup: keyboard });
}

export async function handleProfileAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
  const subAction = params.join(':');

  if (BASIC_PROMPTS.includes(subAction)) {
    await promptInput(ctx, subAction.replace(':', '_'), 'profile:edit');
    return;
  }

  if (PERSONAL_PROMPTS.includes(subAction)) {
    await promptInput(ctx, subAction.replace(':', '_'), 'profile:edit:personal');
    return;
  }

  switch (subAction) {
    case 'view':
      await handleProfileView(ctx, user);
      break;
    case 'stats':
      await handleProfileStats(ctx, user);
      break;
    case 'edit':
      await handleProfileEdit(ctx, user);
      break;
    case 'edit:personal':
      await handleProfileEditPersonal(ctx, user);
      break;
    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleProfileView(ctx: Context, user: UserProfile): Promise<void> {
  const i18n = getI18n();
  await safeEditMessageText(ctx, buildProfileMessage(user, i18n), {
    parse_mode: 'HTML',
    reply_markup: ProfileMenuFactory.createView(user),
  });
}

async function handleProfileEdit(ctx: Context, _user: UserProfile): Promise<void> {
  const i18n = getI18n();
  const msg = i18n.t('user-management.profile.edit_prompt');
  await safeEditMessageText(ctx, msg, {
    parse_mode: 'HTML',
    reply_markup: ProfileMenuFactory.createEdit(),
  });
}

async function handleProfileEditPersonal(ctx: Context, _user: UserProfile): Promise<void> {
  const i18n = getI18n();
  const msg = i18n.t('user-management.profile.edit_personal_prompt');
  await safeEditMessageText(ctx, msg, {
    parse_mode: 'HTML',
    reply_markup: ProfileMenuFactory.createEditPersonal(),
  });
}

async function handleProfileStats(ctx: Context, user: UserProfile): Promise<void> {
  const result = ProfileMenuFactory.createStats(user);
  await safeEditMessageText(ctx, result.message, {
    parse_mode: 'HTML',
    reply_markup: result.keyboard,
  });
}
