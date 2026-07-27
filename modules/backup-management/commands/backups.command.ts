import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createBackupMenu } from '../menus/backup-menu.factory.js';

export async function backupsCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('backup-management.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createBackupMenu(i18n.t),
  });
}
