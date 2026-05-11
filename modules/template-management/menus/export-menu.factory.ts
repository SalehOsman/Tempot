import { InlineKeyboard } from 'grammy';

export function createExportMenu(t: (key: string) => string, templateId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('template-management.actions.export_json'), `tmpl:export:${templateId}:json`)
    .text(t('template-management.actions.export_pdf'), `tmpl:export:${templateId}:pdf`)
    .row()
    .text(t('template-management.menu.back'), `tmpl:view:${templateId}`);
}
