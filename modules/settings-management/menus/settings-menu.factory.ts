import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
export type SettingsMenuSurface = 'main' | 'profile' | 'regional' | 'regional-leaf' | 'access-mode';

export function createSettingsMenu(
  t: TranslationFn,
  surface: SettingsMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'profile') return createProfileSettingsMenu(t);
  if (surface === 'regional') return createRegionalSettingsMenu(t);
  if (surface === 'regional-leaf') return createRegionalLeafMenu(t);
  if (surface === 'access-mode') return createAccessModeMenu(t);
  return createMainSettingsMenu(t);
}

function createMainSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.profile'), 'settings:profile')
    .text(t('settings-management.menu.regional'), 'settings:regional')
    .row()
    .text(t('settings-management.menu.access_mode'), 'settings:access-mode')
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

function createAccessModeMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.access_mode_private'), 'settings:access-mode:set:private')
    .text(t('settings-management.menu.access_mode_public'), 'settings:access-mode:set:public')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}
