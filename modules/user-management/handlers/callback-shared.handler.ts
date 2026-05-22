import { Context, InlineKeyboard } from 'grammy';
import { answerCallback } from '@tempot/ux-helpers';
import { getI18n, getLogger } from '../deps.context.js';

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
    await acknowledgeCallback(ctx);
  } catch (error) {
    if (error instanceof Error && error.message.includes('message is not modified')) {
      await acknowledgeCallback(ctx, getI18n().t('bot-server.callback_unchanged'));
      return;
    }
    log.error({ msg: 'editMessageText failed', error: String(error) });
    throw error;
  }
}

async function acknowledgeCallback(ctx: Context, text?: string): Promise<void> {
  const result = await answerCallback(ctx as unknown as Parameters<typeof answerCallback>[0], {
    text,
  });
  if (result.isErr()) throw result.error;
}
