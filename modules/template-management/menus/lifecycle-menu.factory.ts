import { InlineKeyboard } from 'grammy';

export function createConfirmDeleteMenu(
  t: (key: string) => string,
  templateId: string,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('template-management.actions.confirm_yes'), `tmpl:delete:${templateId}:confirm`)
    .text(t('template-management.actions.confirm_no'), `tmpl:view:${templateId}`);
}
