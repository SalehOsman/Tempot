import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type MessageMenuSurface = 'main' | 'leaf';

export function createMessageMenu(
  t: TranslationFn,
  surface: MessageMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'leaf') return createMessageLeafMenu(t);
  return createMessageMainMenu(t);
}

function createMessageMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('content-management.menu.templates'), 'messages:templates')
    .text(t('content-management.menu.cms'), 'messages:cms')
    .row()
    .text(t('content-management.menu.back'), 'menu:main');
}

function createMessageLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('content-management.menu.button'), 'messages:view')
    .row()
    .text(t('content-management.menu.back'), 'menu:main');
}
