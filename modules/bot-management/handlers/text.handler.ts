import type { Context } from 'grammy';
import { BotRuntimeMode } from '../types/bot.types.js';
import { getI18n } from '../deps.context.js';
import { getBotService } from '../services/bot-service.context.js';
import { formatBotDetailMessage } from '../menus/bot-detail.factory.js';
import { createBotDetailMenu } from '../menus/bot-menu.factory.js';
import { clearBotInputState, getBotInputState, setBotInputState } from './bot-state.service.js';

export async function handleTextInput(ctx: Context): Promise<void> {
  const message = ctx.message?.text;
  const telegramId = ctx.from?.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;
  if (!message || message.startsWith('/') || !telegramId || !chatId) return;

  const state = await getBotInputState(telegramId, chatId);
  if (!state) return;

  const i18n = getI18n();
  if (state.step === 'display_name') {
    await setBotInputState(telegramId, chatId, {
      step: 'telegram_username',
      data: { displayName: message.trim() },
    });
    await ctx.reply(i18n.t('bot-management.create.prompt.telegram_username'));
    return;
  }
  if (state.step === 'telegram_username') {
    await setBotInputState(telegramId, chatId, {
      step: 'token',
      data: { ...state.data, telegramUsername: message.trim().replace(/^@/, '') },
    });
    await ctx.reply(i18n.t('bot-management.create.prompt.token'));
    return;
  }

  await completeRegistration({ ctx, telegramId, chatId, token: message.trim() });
}

interface CompleteRegistrationInput {
  ctx: Context;
  telegramId: string;
  chatId: string;
  token: string;
}

async function completeRegistration(input: CompleteRegistrationInput): Promise<void> {
  const { ctx, telegramId, chatId, token } = input;
  const i18n = getI18n();
  const state = await getBotInputState(telegramId, chatId);
  if (!state?.data.displayName || !state.data.telegramUsername) return;

  const result = await getBotService().register(
    {
      displayName: state.data.displayName,
      telegramUsername: state.data.telegramUsername,
      token,
      ownerId: telegramId,
      runtimeMode: BotRuntimeMode.POLLING,
      defaultLocale: 'ar-EG',
      defaultCountry: 'EG',
      timezone: 'Africa/Cairo',
    },
    telegramId,
  );
  await clearBotInputState(telegramId, chatId);

  if (result.isErr()) {
    await ctx.reply(i18n.t(`bot-management.error.${result.error.code.split('.').at(-1)}`));
    return;
  }
  await ctx.reply(formatBotDetailMessage(i18n.t, result.value), {
    reply_markup: createBotDetailMenu(i18n.t, result.value),
  });
}
