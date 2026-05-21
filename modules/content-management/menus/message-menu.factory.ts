import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;

export function createMessageMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('content-management.menu.templates'), 'messages:templates')
    .text(t('content-management.menu.cms'), 'messages:cms')
    .row()
    .text(t('content-management.menu.back'), 'menu:main');
}
