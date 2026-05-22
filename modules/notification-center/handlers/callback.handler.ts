import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createNotificationMenu } from '../menus/notification-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('notifications:')) {
    await next();
    return;
  }

  const action = data.split(':')[1] ?? 'view';
  if (action === 'test') {
    await publishTestRequest(ctx);
  }
  await showNotificationPage(ctx, action);
}

async function publishTestRequest(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id.toString() ?? '';
  await getDeps().eventBus.publish('notification-center.notification.test_requested', {
    telegramId,
  });
}

async function showNotificationPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key =
    action === 'view' || action === 'test'
      ? 'notification-center.view.title'
      : 'notification-center.view.preferences';

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key),
    parseMode: 'HTML',
    replyMarkup: createNotificationMenu(i18n.t),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}
