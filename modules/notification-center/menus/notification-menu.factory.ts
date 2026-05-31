import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type NotificationMenuSurface = 'main' | 'preferences' | 'activity' | 'test-result';

export function createNotificationMenu(
  t: TranslationFn,
  surface: NotificationMenuSurface = 'main',
  opts: { notificationsEnabled?: boolean } = {},
): InlineKeyboard {
  if (surface === 'preferences') return createPreferencesMenu(t, opts.notificationsEnabled);
  if (surface === 'activity') return createLeafMenu(t);
  if (surface === 'test-result') return createTestResultMenu(t);
  return createMainMenu(t);
}

function createMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test'), 'notifications:test')
    .text(t('notification-center.menu.preferences'), 'notifications:preferences')
    .row()
    .text(t('notification-center.menu.activity'), 'notifications:activity')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.center'), 'notifications:view')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createPreferencesMenu(t: TranslationFn, enabled: boolean | undefined): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (enabled !== undefined) {
    keyboard.text(
      enabled
        ? t('notification-center.menu.disable_notifications')
        : t('notification-center.menu.enable_notifications'),
      'notifications:toggle',
    );
    keyboard.row();
  }
  return keyboard
    .text(t('notification-center.menu.center'), 'notifications:view')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createTestResultMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test_again'), 'notifications:test')
    .row()
    .text(t('notification-center.menu.center'), 'notifications:view')
    .text(t('notification-center.menu.back'), 'menu:main');
}
