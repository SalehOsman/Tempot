import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
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

  const action = data.split(':')[1] ?? 'view';
  await showMessagePage(ctx, action);
}

async function showMessagePage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key =
    action === 'view' ? 'content-management.view.title' : `content-management.view.${action}`;

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key),
    parseMode: 'HTML',
    replyMarkup: createMessageMenu(i18n.t),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}
