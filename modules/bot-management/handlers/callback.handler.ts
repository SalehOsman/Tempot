import type { Context } from 'grammy';
import { getI18n } from '../deps.context.js';
import { getBotService } from '../services/bot-service.context.js';
import { createBotDetailMenu, createBotListMenu } from '../menus/bot-menu.factory.js';
import { formatBotDetailMessage, formatBotListMessage } from '../menus/bot-detail.factory.js';
import { newBotCommand } from '../commands/new-bot.command.js';

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('botmgmt:')) return;

  await ctx.answerCallbackQuery();
  const [, action, value] = data.split(':');

  if (action === 'create') {
    await newBotCommand(ctx);
    return;
  }
  if (action === 'view' && value) {
    await showBotDetail(ctx, value);
    return;
  }
  if (action === 'list') {
    await showBotList(ctx, Number(value ?? 0));
  }
}

async function showBotList(ctx: Context, page: number): Promise<void> {
  const i18n = getI18n();
  const result = await getBotService().list(page);
  if (result.isErr()) {
    await ctx.reply(i18n.t('bot-management.error.list_failed'));
    return;
  }

  const totalPages = Math.max(1, Math.ceil(result.value.totalCount / result.value.pageSize));
  await ctx.editMessageText(formatBotListMessage(i18n.t, result.value), {
    reply_markup: createBotListMenu({ t: i18n.t, bots: result.value.bots, page, totalPages }),
  });
}

async function showBotDetail(ctx: Context, botId: string): Promise<void> {
  const i18n = getI18n();
  const result = await getBotService().getDetail(botId);
  if (result.isErr()) {
    await ctx.reply(i18n.t('bot-management.error.not_found'));
    return;
  }

  await ctx.editMessageText(formatBotDetailMessage(i18n.t, result.value), {
    reply_markup: createBotDetailMenu(i18n.t, result.value),
  });
}
