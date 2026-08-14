import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createHelpMenu } from '../menus/help-menu.factory.js';

export async function helpCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('help-center.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createHelpMenu(i18n.t),
  });
}
