import type { Context } from 'grammy';
import { createMainMenu } from '../menus/template-menu.factory.js';
import { getDeps } from '../deps.context.js';

export async function templatesCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  const t = (key: string) => i18n.t(key);

  await ctx.reply(t('template-management.menu.title'), {
    reply_markup: createMainMenu(t),
  });
}
