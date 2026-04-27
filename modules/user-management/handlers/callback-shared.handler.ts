import { Context, InlineKeyboard } from 'grammy';
import { getLogger } from '../deps.context.js';

export async function safeEditMessageText(
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
