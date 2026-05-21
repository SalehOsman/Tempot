import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createNotificationMenu } from '../menus/notification-menu.factory.js';

export async function notificationsCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('notification-center.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createNotificationMenu(i18n.t),
  });
}
