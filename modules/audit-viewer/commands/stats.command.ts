import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createStatsMenu } from '../menus/stats-menu.factory.js';

export async function statsCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('audit-viewer.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createStatsMenu(i18n.t),
  });
}
