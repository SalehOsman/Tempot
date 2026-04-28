import type { Context } from 'grammy';
import { getI18n, getLogger } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import { getUserService } from '../services/user-service.context.js';
import { getUserInputState, clearUserInputState } from './user-state.service.js';
import {
  handleEditName,
  handleEditEmail,
  handleEditLanguage,
  handleEditRole,
} from './text.editors.js';
import {
  handleEditNationalId,
  handleEditMobile,
  handleEditBirthDate,
  handleEditGender,
  handleEditGovernorate,
  handleEditCountryCode,
} from './text-egyptian.editors.js';

interface DispatchPayload {
  action: string;
  text: string;
}

async function dispatchTextAction(
  ctx: Context,
  user: UserProfile,
  payload: DispatchPayload,
): Promise<void> {
  const { action, text } = payload;
  switch (action) {
    case 'edit_name':
      await handleEditName(ctx, user, text);
      break;
    case 'edit_email':
      await handleEditEmail(ctx, user, text);
      break;
    case 'edit_language':
      await handleEditLanguage(ctx, user, text);
      break;
    case 'edit_role':
      await handleEditRole(ctx, user, text);
      break;
    case 'edit_national_id':
      await handleEditNationalId(ctx, user, text);
      break;
    case 'edit_mobile':
      await handleEditMobile(ctx, user, text);
      break;
    case 'edit_birth_date':
      await handleEditBirthDate(ctx, user, text);
      break;
    case 'edit_gender':
      await handleEditGender(ctx, user, text);
      break;
    case 'edit_governorate':
      await handleEditGovernorate(ctx, user, text);
      break;
    case 'edit_country_code':
      await handleEditCountryCode(ctx, user, text);
      break;
  }
}

export async function handleTextInput(ctx: Context): Promise<void> {
  const log = getLogger().child({ handler: 'text' });
  const i18n = getI18n();

  const message = ctx.message;
  if (!message?.text) return;
  if (message.text.startsWith('/')) return;

  const text = message.text.trim();
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const telegramId = telegramUser.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  const state = await getUserInputState(telegramId, chatId);
  if (!state) return;

  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) {
    log.warn({ msg: 'text_handler_user_not_found', telegramId });
    await ctx.reply(i18n.t('user-management.profile.not_found'));
    return;
  }

  await dispatchTextAction(ctx, userResult.value, { action: state.action, text });
  await clearUserInputState(telegramId, chatId);
}
