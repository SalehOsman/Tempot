import { InlineKeyboard } from 'grammy';
import { TemplateStatus } from '../types/template.types.js';

export interface DetailMenuContext {
  templateId: string;
  status: TemplateStatus;
  isOwner: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
}

export function createDetailMenu(
  t: (key: string) => string,
  ctx: DetailMenuContext,
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const { templateId, status, isOwner, isAdmin, isSubscribed } = ctx;

  if (status === TemplateStatus.DRAFT && isOwner) {
    kb.text(t('template-management.actions.edit'), `tmpl:edit:${templateId}`)
      .text(t('template-management.actions.delete'), `tmpl:delete:${templateId}`)
      .row();
    kb.text(t('template-management.actions.submit_review'), `tmpl:submit:${templateId}`).row();
  }

  if (status === TemplateStatus.REVIEW && isAdmin) {
    kb.text(t('template-management.actions.publish'), `tmpl:publish:${templateId}`)
      .text(t('template-management.actions.reject'), `tmpl:reject:${templateId}`)
      .row();
  }

  if (status === TemplateStatus.PUBLISHED) {
    kb.text(t('template-management.actions.clone'), `tmpl:clone:${templateId}`).row();
    kb.text(t('template-management.actions.rate'), `tmpl:rate:${templateId}`)
      .text(t('template-management.actions.versions'), `tmpl:versions:${templateId}`)
      .row();

    if (isOwner || isAdmin) {
      kb.text(t('template-management.actions.archive'), `tmpl:archive:${templateId}`).row();
    }
  }

  if (status === TemplateStatus.ARCHIVED && isOwner) {
    kb.text(t('template-management.actions.reactivate'), `tmpl:reactivate:${templateId}`).row();
  }

  kb.text(t('template-management.actions.export'), `tmpl:export:${templateId}`).row();

  if (isSubscribed) {
    kb.text(t('template-management.actions.unsubscribe'), `tmpl:unsubscribe:${templateId}`);
  } else {
    kb.text(t('template-management.actions.subscribe'), `tmpl:subscribe:${templateId}`);
  }
  kb.row();

  kb.text(t('template-management.menu.back'), 'tmpl:my');
  return kb;
}
