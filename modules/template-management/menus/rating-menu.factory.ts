import { InlineKeyboard } from 'grammy';

export function createRatingMenu(t: (key: string) => string, templateId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('template-management.rating.stars_1'), `tmpl:rate:${templateId}:1`)
    .text(t('template-management.rating.stars_2'), `tmpl:rate:${templateId}:2`)
    .text(t('template-management.rating.stars_3'), `tmpl:rate:${templateId}:3`)
    .row()
    .text(t('template-management.rating.stars_4'), `tmpl:rate:${templateId}:4`)
    .text(t('template-management.rating.stars_5'), `tmpl:rate:${templateId}:5`)
    .row()
    .text(t('template-management.menu.back'), `tmpl:view:${templateId}`);
}
