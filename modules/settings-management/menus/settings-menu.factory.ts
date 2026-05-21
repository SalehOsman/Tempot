import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;

export function createSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.profile'), 'settings:profile')
    .text(t('settings-management.menu.notifications'), 'settings:notifications')
    .row()
    .text(t('settings-management.menu.regional'), 'settings:regional')
    .row()
    .text(t('settings-management.menu.back'), 'menu:main');
}
