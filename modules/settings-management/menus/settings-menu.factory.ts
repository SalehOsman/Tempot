import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type SettingsMenuSurface =
  | 'main'
  | 'profile'
  | 'notifications'
  | 'regional'
  | 'regional-leaf';

export function createSettingsMenu(
  t: TranslationFn,
  surface: SettingsMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'profile') return createProfileSettingsMenu(t);
  if (surface === 'notifications') return createNotificationSettingsMenu(t);
  if (surface === 'regional') return createRegionalSettingsMenu(t);
  if (surface === 'regional-leaf') return createRegionalLeafMenu(t);
  return createMainSettingsMenu(t);
}

function createMainSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.profile'), 'settings:profile')
    .text(t('settings-management.menu.notifications'), 'settings:notifications')
    .row()
    .text(t('settings-management.menu.regional'), 'settings:regional')
    .row()
    .text(t('settings-management.menu.back'), 'menu:main');
}

function createProfileSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.open_profile'), 'profile:view')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}

function createNotificationSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.preferences'), 'notifications:preferences')
    .text(t('settings-management.menu.test_notification'), 'notifications:test')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}

function createRegionalSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.language'), 'settings:regional:language')
    .text(t('settings-management.menu.timezone'), 'settings:regional:timezone')
    .row()
    .text(t('settings-management.menu.defaults'), 'settings:regional:defaults')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}

function createRegionalLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.regional'), 'settings:regional')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}
