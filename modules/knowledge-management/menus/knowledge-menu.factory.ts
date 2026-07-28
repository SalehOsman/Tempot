import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
export type KnowledgeMenuSurface = 'main' | 'leaf' | 'confirm-write' | 'confirm-reindex';

export function createKnowledgeMenu(
  t: TranslationFn,
  surface: KnowledgeMenuSurface = 'main',
  token?: string,
): InlineKeyboard {
  if (surface === 'confirm-write') return createConfirmMenu(t, 'confirm_write', token);
  if (surface === 'confirm-reindex') return createConfirmMenu(t, 'confirm_reindex', token);
  if (surface === 'leaf') return createLeafMenu(t);
  return createMainMenu(t);
}

function createMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.status'), 'knowledge:status')
    .row()
    .text(t('knowledge-management.menu.sources'), 'knowledge:sources')
    .row()
    .text(t('knowledge-management.menu.dry_run'), 'knowledge:dry_run')
    .row()
    .text(t('knowledge-management.menu.write'), 'knowledge:write')
    .row()
    .text(t('knowledge-management.menu.full_reindex'), 'knowledge:full_reindex')
    .row()
    .text(t('knowledge-management.menu.history'), 'knowledge:history')
    .row()
    .text(t('knowledge-management.menu.test_query'), 'knowledge:test_query')
    .row()
    .text(t('knowledge-management.menu.back'), 'menu:main');
}

function createLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.button'), 'knowledge:view')
    .row()
    .text(t('knowledge-management.menu.back'), 'menu:main');
}

function createConfirmMenu(t: TranslationFn, action: string, token?: string): InlineKeyboard {
  const callbackData = token ? `knowledge:${action}:${token}` : 'knowledge:view';
  return new InlineKeyboard()
    .text(t(`knowledge-management.menu.${action}`), callbackData)
    .row()
    .text(t('knowledge-management.menu.cancel'), 'knowledge:view');
}
