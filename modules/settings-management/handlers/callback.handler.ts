import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createSettingsMenu, type SettingsMenuSurface } from '../menus/settings-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();
const VIEW_KEYS: Readonly<Record<string, string>> = {
  view: 'settings-management.view.title',
  profile: 'settings-management.view.profile',
  regional: 'settings-management.view.regional',
  'regional:language': 'settings-management.view.regional_language',
  'regional:timezone': 'settings-management.view.regional_timezone',
  'regional:defaults': 'settings-management.view.regional_defaults',
};

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('settings:')) {
    await next();
    return;
  }

  if (
    !(await getDeps().authorization.enforce(ctx, {
      module: 'settings-management',
      classification: 'protected',
      action: 'read',
      subject: 'settings',
    }))
  ) {
    return;
  }
  const action = data.slice('settings:'.length) || 'view';
  await showSettingsPage(ctx, action);
}

async function showSettingsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key = VIEW_KEYS[action] ?? 'settings-management.view.title';

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key),
    viewKey: key,
    parseMode: 'HTML',
    replyMarkup: createSettingsMenu(i18n.t, resolveMenuSurface(action)),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

function resolveMenuSurface(action: string): SettingsMenuSurface {
  const [section] = action.split(':');
  if (section === 'regional' && action !== 'regional') return 'regional-leaf';
  if (section === 'profile' || section === 'regional') {
    return section;
  }
  return 'main';
}
