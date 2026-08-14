import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createMessageMenu } from '../menus/message-menu.factory.js';

export async function messagesCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('content-management.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createMessageMenu(i18n.t),
  });
}
