import type { Context } from 'grammy';
import { getI18n } from '../deps.context.js';

export const BOT_REGISTRATION_FLOW_ID = 'bot-management-registration';

interface ConversationStarterContext extends Context {
  conversation?: {
    enter: (flowId: string) => Promise<void>;
  };
}

export async function newBotCommand(ctx: Context): Promise<void> {
  const i18n = getI18n();
  const telegramId = ctx.from?.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  if (!telegramId || !chatId) {
    await ctx.reply(i18n.t('bot-management.error.no_user'));
    return;
  }

  const starter = ctx as ConversationStarterContext;
  if (!starter.conversation) {
    await ctx.reply(i18n.t('bot-management.error.create_failed'));
    return;
  }

  await starter.conversation.enter(BOT_REGISTRATION_FLOW_ID);
}
