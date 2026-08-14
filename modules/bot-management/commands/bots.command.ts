import type { Context } from 'grammy';
import { getI18n, getLogger } from '../deps.context.js';
import { getBotService } from '../services/bot-service.context.js';
import { createBotListMenu } from '../menus/bot-menu.factory.js';
import { formatBotListMessage } from '../menus/bot-detail.factory.js';

export async function botsCommand(ctx: Context): Promise<void> {
  const log = getLogger().child({ command: 'bots' });
  const i18n = getI18n();
  const result = await getBotService().list(0);

  if (result.isErr()) {
    log.warn({ msg: 'bots_command_failed', errorCode: result.error.code });
    await ctx.reply(i18n.t('bot-management.error.list_failed'));
    return;
  }

  const totalPages = Math.max(1, Math.ceil(result.value.totalCount / result.value.pageSize));
  await ctx.reply(formatBotListMessage(i18n.t, result.value), {
    reply_markup: createBotListMenu({ t: i18n.t, bots: result.value.bots, page: 0, totalPages }),
  });
}
