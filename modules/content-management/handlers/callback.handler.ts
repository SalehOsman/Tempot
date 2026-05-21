import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createMessageMenu } from '../menus/message-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('messages:')) {
    await next();
    return;
  }

  await ctx.answerCallbackQuery();
  const action = data.split(':')[1] ?? 'view';
  await showMessagePage(ctx, action);
}

async function showMessagePage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key =
    action === 'view' ? 'content-management.view.title' : `content-management.view.${action}`;
  await ctx.editMessageText(i18n.t(key), {
    parse_mode: 'HTML',
    reply_markup: createMessageMenu(i18n.t),
  });
}
