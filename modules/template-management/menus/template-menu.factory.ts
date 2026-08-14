import { InlineKeyboard } from 'grammy';

export function createMainMenu(t: (key: string) => string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('template-management.menu.my_templates'), 'tmpl:my')
    .text(t('template-management.menu.browse'), 'tmpl:browse')
    .row()
    .text(t('template-management.menu.create'), 'tmpl:create');
}

export function createMyTemplatesMenu(input: {
  t: (key: string) => string;
  templates: { id: string; name: string; status: string }[];
  page: number;
  totalPages: number;
}): InlineKeyboard {
  const { t, templates, page, totalPages } = input;
  const kb = new InlineKeyboard();

  for (const tmpl of templates) {
    kb.text(`${tmpl.name} [${tmpl.status}]`, `tmpl:view:${tmpl.id}`).row();
  }

  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `tmpl:page:my:${page - 1}`);
    kb.text(`${page + 1}/${totalPages}`, 'noop');
    if (page < totalPages - 1) kb.text('➡️', `tmpl:page:my:${page + 1}`);
    kb.row();
  }

  kb.text(t('template-management.menu.back'), 'tmpl:menu');
  return kb;
}
