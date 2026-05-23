import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type NotificationMenuSurface = 'main' | 'preferences';

export function createNotificationMenu(
  t: TranslationFn,
  surface: NotificationMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'preferences') return createNotificationLeafMenu(t);
  return createNotificationMainMenu(t);
}

function createNotificationMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test'), 'notifications:test')
    .text(t('notification-center.menu.preferences'), 'notifications:preferences')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createNotificationLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.button'), 'notifications:view')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}
