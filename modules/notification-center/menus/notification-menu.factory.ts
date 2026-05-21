import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;

export function createNotificationMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test'), 'notifications:test')
    .text(t('notification-center.menu.preferences'), 'notifications:preferences')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}
