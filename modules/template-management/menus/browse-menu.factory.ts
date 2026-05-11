import { InlineKeyboard } from 'grammy';

export function createBrowseMenu(t: (key: string) => string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('template-management.browse.search'), 'tmpl:search')
    .text(t('template-management.browse.categories'), 'tmpl:categories')
    .row()
    .text(t('template-management.browse.sort_rating'), 'tmpl:sort:rating')
    .text(t('template-management.browse.sort_usage'), 'tmpl:sort:usage')
    .row()
    .text(t('template-management.browse.sort_newest'), 'tmpl:sort:created')
    .row()
    .text(t('template-management.menu.back'), 'tmpl:menu');
}

export function createBrowseResultsMenu(input: {
  t: (key: string) => string;
  templates: { id: string; name: string; ratingAvg: number }[];
  page: number;
  totalPages: number;
}): InlineKeyboard {
  const { t, templates, page, totalPages } = input;
  const kb = new InlineKeyboard();

  for (const tmpl of templates) {
    const stars = tmpl.ratingAvg > 0 ? ` ⭐${tmpl.ratingAvg.toFixed(1)}` : '';
    kb.text(`${tmpl.name}${stars}`, `tmpl:view:${tmpl.id}`).row();
  }

  if (totalPages > 1) {
    if (page > 0) kb.text('⬅️', `tmpl:page:browse:${page - 1}`);
    kb.text(`${page + 1}/${totalPages}`, 'noop');
    if (page < totalPages - 1) kb.text('➡️', `tmpl:page:browse:${page + 1}`);
    kb.row();
  }

  kb.text(t('template-management.menu.back'), 'tmpl:browse');
  return kb;
}
