import { Context, InlineKeyboard } from 'grammy';
import { getUserService } from '../services/user-service.context.js';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import { getI18n, getLogger } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import { setUserInputState } from './user-state.service.js';
import { handleUsersAction } from './users.callback.handler.js';
import { buildProfileMessage } from '../commands/profile.command.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function safeEditMessageText(
  ctx: Context,
  text: string,
  options: { parse_mode?: 'HTML' | 'Markdown'; reply_markup?: InlineKeyboard },
): Promise<void> {
  const log = getLogger().child({ fn: 'safeEditMessageText' });
  if (!ctx.callbackQuery?.message) {
    log.error({ msg: 'No callbackQuery.message' });
    return;
  }

  try {
    await ctx.editMessageText(text, options);
    await ctx.answerCallbackQuery();
  } catch (error) {
    if (error instanceof Error && error.message.includes('message is not modified')) {
      await ctx.answerCallbackQuery();
      return;
    }
    log.error({ msg: 'editMessageText failed', error: String(error) });
    throw error;
  }
}

function parseCallbackData(data: string): { action: string; params: string[] } {
  const [action, ...params] = data.split(':');
  return { action, params };
}

async function fetchUser(telegramId: string): Promise<UserProfile | null> {
  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) return null;
  return userResult.value;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function handleCallbackQuery(ctx: Context): Promise<void> {
  const log = getLogger().child({ handler: 'callback' });
  try {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery?.data) {
      await ctx.answerCallbackQuery('❌ Invalid callback query');
      return;
    }

    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.answerCallbackQuery('❌ Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();
    const { action, params } = parseCallbackData(callbackQuery.data);

    log.info({ msg: 'callback_received', telegramId, action, params });

    const user = await fetchUser(telegramId);
    if (!user) {
      await ctx.answerCallbackQuery('❌ الملف الشخصي غير موجود');
      return;
    }

    await dispatchCallbackAction(ctx, user, { action, params });
  } catch (error) {
    log.error({ msg: 'callback_error', error: String(error) });
    await ctx.answerCallbackQuery('❌ حدث خطأ أثناء معالجة طلبك');
  }
}

async function dispatchCallbackAction(
  ctx: Context,
  user: UserProfile,
  payload: { action: string; params: string[] },
): Promise<void> {
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
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

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
      reply_markup: MainMenuFactory.create(user),
    });
  } else {
    await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function handleProfileAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
  const subAction = params.join(':');

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

    // ── أساسية ──
    case 'edit:name':
      await promptInput(ctx, 'edit_name', 'profile:edit');
      break;
    case 'edit:email':
      await promptInput(ctx, 'edit_email', 'profile:edit');
      break;
    case 'edit:language':
      await promptInput(ctx, 'edit_language', 'profile:edit');
      break;
    case 'edit:role':
      await promptInput(ctx, 'edit_role', 'profile:edit');
      break;

    // ── مصرية ──
    case 'edit:national_id':
      await promptInput(ctx, 'edit_national_id', 'profile:edit:personal');
      break;
    case 'edit:mobile':
      await promptInput(ctx, 'edit_mobile', 'profile:edit:personal');
      break;
    case 'edit:birth_date':
      await promptInput(ctx, 'edit_birth_date', 'profile:edit:personal');
      break;
    case 'edit:gender':
      await promptInput(ctx, 'edit_gender', 'profile:edit:personal');
      break;
    case 'edit:governorate':
      await promptInput(ctx, 'edit_governorate', 'profile:edit:personal');
      break;
    case 'edit:country_code':
      await promptInput(ctx, 'edit_country_code', 'profile:edit:personal');
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

// ─── Input prompt helper ──────────────────────────────────────────────────────

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

export { handleCallbackQuery };
