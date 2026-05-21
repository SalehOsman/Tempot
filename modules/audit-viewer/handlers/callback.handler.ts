import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createStatsMenu } from '../menus/stats-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('stats:')) {
    await next();
    return;
  }

  await ctx.answerCallbackQuery();
  const action = data.split(':')[1] ?? 'view';
  await showStatsPage(ctx, action);
}

async function showStatsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key = action === 'view' ? 'audit-viewer.view.title' : `audit-viewer.view.${action}`;
  await ctx.editMessageText(i18n.t(key), {
    parse_mode: 'HTML',
    reply_markup: createStatsMenu(i18n.t),
  });
}
