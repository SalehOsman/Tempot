import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createSettingsMenu } from '../menus/settings-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('settings:')) {
    await next();
    return;
  }

  await ctx.answerCallbackQuery();
  const action = data.split(':')[1] ?? 'view';
  await showSettingsPage(ctx, action);
}

async function showSettingsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key =
    action === 'view' ? 'settings-management.view.title' : `settings-management.view.${action}`;
  await ctx.editMessageText(i18n.t(key), {
    parse_mode: 'HTML',
    reply_markup: createSettingsMenu(i18n.t),
  });
}
