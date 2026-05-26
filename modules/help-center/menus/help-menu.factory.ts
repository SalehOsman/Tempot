import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type HelpMenuSurface = 'main' | 'leaf';

export function createHelpMenu(
  t: TranslationFn,
  surface: HelpMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'leaf') return createHelpLeafMenu(t);
  return createHelpMainMenu(t);
}

function createHelpMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('help-center.menu.commands'), 'help:commands')
    .text(t('help-center.menu.support'), 'help:support')
    .row()
    .text(t('help-center.menu.back'), 'menu:main');
}

function createHelpLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('help-center.menu.button'), 'help:view')
    .row()
    .text(t('help-center.menu.back'), 'menu:main');
}
