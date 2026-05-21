import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;

export function createHelpMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('help-center.menu.commands'), 'help:commands')
    .text(t('help-center.menu.support'), 'help:support')
    .row()
    .text(t('help-center.menu.back'), 'menu:main');
}
