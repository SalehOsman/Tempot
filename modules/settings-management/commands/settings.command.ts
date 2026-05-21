import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createSettingsMenu } from '../menus/settings-menu.factory.js';

export async function settingsCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('settings-management.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createSettingsMenu(i18n.t),
  });
}
