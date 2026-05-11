import { InlineKeyboard } from 'grammy';
import type { Category } from '../types/category.types.js';

export function createCategoryBrowseMenu(
  t: (key: string) => string,
  categories: Category[],
  language: string,
): InlineKeyboard {
  const kb = new InlineKeyboard();

  for (const cat of categories) {
    const name = language === 'ar' ? cat.nameAr : cat.nameEn;
    const icon = cat.icon ? `${cat.icon} ` : '';
    kb.text(`${icon}${name}`, `tmpl:category:${cat.id}`).row();
  }

  kb.text(t('template-management.menu.back'), 'tmpl:browse');
  return kb;
}

export function createCategoryManageMenu(
  t: (key: string) => string,
  categories: Category[],
  language: string,
): InlineKeyboard {
  const kb = new InlineKeyboard();

  for (const cat of categories) {
    const name = language === 'ar' ? cat.nameAr : cat.nameEn;
    kb.text(name, `tmpl:cat:edit:${cat.id}`).row();
  }

  kb.text(t('template-management.categories.add'), 'tmpl:cat:add').row();
  kb.text(t('template-management.menu.back'), 'tmpl:menu');
  return kb;
}
