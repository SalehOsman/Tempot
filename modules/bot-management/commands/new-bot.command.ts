import type { Context } from 'grammy';
import { getI18n } from '../deps.context.js';
import { setBotInputState } from '../handlers/bot-state.service.js';

export async function newBotCommand(ctx: Context): Promise<void> {
  const i18n = getI18n();
  const telegramId = ctx.from?.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  if (!telegramId || !chatId) {
    await ctx.reply(i18n.t('bot-management.error.no_user'));
    return;
  }

  await setBotInputState(telegramId, chatId, { step: 'display_name', data: {} });
  await ctx.reply(i18n.t('bot-management.create.prompt.display_name'));
}
