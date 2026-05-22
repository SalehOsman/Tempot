import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createHelpMenu } from '../menus/help-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('help:')) {
    await next();
    return;
  }

  await ctx.answerCallbackQuery();
  const action = data.split(':')[1] ?? 'view';
  await showHelpPage(ctx, action);
}

async function showHelpPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key = action === 'view' ? 'help-center.view.title' : `help-center.view.${action}`;

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key),
    parseMode: 'HTML',
    replyMarkup: createHelpMenu(i18n.t),
  });
  if (result.isErr()) throw result.error;
}
