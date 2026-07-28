import { InlineKeyboard } from 'grammy';
import type { KnowledgeSourceProfile } from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
export type KnowledgeMenuSurface =
  | 'main'
  | 'leaf'
  | 'sources'
  | 'source-actions'
  | 'confirm-write'
  | 'confirm-reindex';

export interface KnowledgeMenuState {
  readonly token?: string;
  readonly profileId?: string;
  readonly profiles?: readonly KnowledgeSourceProfile[];
}

export function createKnowledgeMenu(
  t: TranslationFn,
  surface: KnowledgeMenuSurface = 'main',
  state: KnowledgeMenuState = {},
): InlineKeyboard {
  if (surface === 'confirm-write') return createConfirmMenu(t, 'confirm_write', state.token);
  if (surface === 'confirm-reindex') return createConfirmMenu(t, 'confirm_reindex', state.token);
  if (surface === 'sources') return createSourcesMenu(t, state.profiles ?? []);
  if (surface === 'source-actions') return createSourceActionsMenu(t, state.profileId);
  if (surface === 'leaf') return createLeafMenu(t);
  return createMainMenu(t);
}

function createMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.status'), 'knowledge:status')
    .row()
    .text(t('knowledge-management.menu.sources'), 'knowledge:sources')
    .row()
    .text(t('knowledge-management.menu.write'), 'knowledge:sources')
    .row()
    .text(t('knowledge-management.menu.history'), 'knowledge:history')
    .row()
    .text(t('knowledge-management.menu.test_query'), 'knowledge:test_query')
    .row()
    .text(t('knowledge-management.menu.back'), 'menu:main');
}

function createSourcesMenu(
  t: TranslationFn,
  profiles: readonly KnowledgeSourceProfile[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const item of profiles) {
    keyboard.text(profileLabel(t, item), `knowledge:source:${item.id}`).row();
  }
  return keyboard
    .text(t('knowledge-management.menu.custom_source'), 'knowledge:custom')
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:view');
}

function createSourceActionsMenu(t: TranslationFn, profileId?: string): InlineKeyboard {
  if (!profileId) return createLeafMenu(t);
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.dry_run'), `knowledge:dry_run:${profileId}`)
    .row()
    .text(t('knowledge-management.menu.write'), `knowledge:write:${profileId}`)
    .row()
    .text(t('knowledge-management.menu.full_reindex'), `knowledge:full_reindex:${profileId}`)
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:sources');
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

function profileLabel(t: TranslationFn, profile: KnowledgeSourceProfile): string {
  return profile.displayName ?? t(profile.labelKey);
}
