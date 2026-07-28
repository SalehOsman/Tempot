import { InlineKeyboard } from 'grammy';
import type { KnowledgeSourceProfile } from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
export type KnowledgeMenuSurface =
  | 'main'
  | 'leaf'
  | 'sources'
  | 'source-actions'
  | 'providers'
  | 'chat-providers'
  | 'embedding-providers'
  | 'embedding-models'
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
  if (surface === 'providers') return createProviderSettingsMenu(t);
  if (surface === 'chat-providers') return createChatProvidersMenu(t);
  if (surface === 'embedding-providers') return createEmbeddingProvidersMenu(t);
  if (surface === 'embedding-models') return createEmbeddingModelsMenu(t);
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
    .text(t('knowledge-management.menu.providers'), 'knowledge:providers')
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

function createProviderSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.chat_provider'), 'knowledge:providers:chat')
    .row()
    .text(t('knowledge-management.menu.embedding_provider'), 'knowledge:providers:embedding')
    .row()
    .text(t('knowledge-management.menu.embedding_model'), 'knowledge:providers:model')
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:view');
}

function createChatProvidersMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.provider_gemini'), 'knowledge:providers:chat:set:gemini')
    .row()
    .text(t('knowledge-management.menu.provider_openai'), 'knowledge:providers:chat:set:openai')
    .row()
    .text(t('knowledge-management.menu.provider_deepseek'), 'knowledge:providers:chat:set:deepseek')
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
}

function createEmbeddingProvidersMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      t('knowledge-management.menu.provider_gemini'),
      'knowledge:providers:embedding:set:gemini',
    )
    .row()
    .text(
      t('knowledge-management.menu.provider_openai'),
      'knowledge:providers:embedding:set:openai',
    )
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
}

function createEmbeddingModelsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      t('knowledge-management.menu.model_gemini_v2'),
      'knowledge:providers:model:set:gemini-embedding-2-preview',
    )
    .row()
    .text(
      t('knowledge-management.menu.model_openai_small'),
      'knowledge:providers:model:set:text-embedding-3-small',
    )
    .row()
    .text(
      t('knowledge-management.menu.model_openai_large'),
      'knowledge:providers:model:set:text-embedding-3-large',
    )
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
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
