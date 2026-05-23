import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type StatsMenuSurface = 'main' | 'leaf';

export function createStatsMenu(
  t: TranslationFn,
  surface: StatsMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'leaf') return createStatsLeafMenu(t);
  return createStatsMainMenu(t);
}

function createStatsMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('audit-viewer.menu.modules'), 'stats:modules')
    .text(t('audit-viewer.menu.runtime'), 'stats:runtime')
    .row()
    .text(t('audit-viewer.menu.problems'), 'stats:problems')
    .text(t('audit-viewer.menu.timeline'), 'stats:timeline')
    .row()
    .text(t('audit-viewer.menu.back'), 'menu:main');
}

function createStatsLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('audit-viewer.menu.button'), 'stats:view')
    .row()
    .text(t('audit-viewer.menu.back'), 'menu:main');
}
