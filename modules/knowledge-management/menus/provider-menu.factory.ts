import { InlineKeyboard } from 'grammy';
import type { KnowledgeProviderSettingsSnapshot } from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
type ChatProvider = KnowledgeProviderSettingsSnapshot['chatProvider'];
type EmbeddingProvider = KnowledgeProviderSettingsSnapshot['embeddingProvider'];

export function createProviderSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('knowledge-management.menu.chat_provider'), 'knowledge:providers:chat')
    .row()
    .text(t('knowledge-management.menu.embedding_provider'), 'knowledge:providers:embedding')
    .row()
    .text(t('knowledge-management.menu.embedding_model'), 'knowledge:providers:model')
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:view');
}

export function createChatProvidersMenu(
  t: TranslationFn,
  settings?: KnowledgeProviderSettingsSnapshot,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(providerLabel(t, settings, 'gemini'), chatCallback(settings, 'gemini'))
    .row()
    .text(providerLabel(t, settings, 'openai'), chatCallback(settings, 'openai'))
    .row()
    .text(providerLabel(t, settings, 'deepseek'), chatCallback(settings, 'deepseek'))
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
}

export function createEmbeddingProvidersMenu(
  t: TranslationFn,
  settings?: KnowledgeProviderSettingsSnapshot,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(embeddingLabel(t, settings, 'gemini'), embeddingCallback(settings, 'gemini'))
    .row()
    .text(embeddingLabel(t, settings, 'openai'), embeddingCallback(settings, 'openai'))
    .row()
    .text(embeddingLabel(t, settings, 'ollama'), embeddingCallback(settings, 'ollama'))
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
}

export function createEmbeddingModelsMenu(
  t: TranslationFn,
  settings?: KnowledgeProviderSettingsSnapshot,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      modelLabel(t, settings, 'gemini-embedding-2-preview'),
      modelCallback(settings, 'gemini-embedding-2-preview'),
    )
    .row()
    .text(
      modelLabel(t, settings, 'text-embedding-3-small'),
      modelCallback(settings, 'text-embedding-3-small'),
    )
    .row()
    .text(
      modelLabel(t, settings, 'text-embedding-3-large'),
      modelCallback(settings, 'text-embedding-3-large'),
    )
    .row()
    .text(modelLabel(t, settings, 'embeddinggemma'), modelCallback(settings, 'embeddinggemma'))
    .row()
    .text(t('knowledge-management.menu.back'), 'knowledge:providers');
}

function providerLabel(
  t: TranslationFn,
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  provider: ChatProvider,
): string {
  return optionLabel(t, providerKey(provider), settings?.chatProvider === provider);
}

function embeddingLabel(
  t: TranslationFn,
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  provider: EmbeddingProvider,
): string {
  return optionLabel(t, providerKey(provider), settings?.embeddingProvider === provider);
}

function modelLabel(
  t: TranslationFn,
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  model: string,
): string {
  return optionLabel(t, modelKey(model), settings?.embeddingModel === model);
}

function optionLabel(t: TranslationFn, labelKey: string, current: boolean): string {
  const label = t(labelKey);
  return current ? t('knowledge-management.menu.current_option', { label }) : label;
}

function chatCallback(
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  provider: ChatProvider,
): string {
  return settings?.chatProvider === provider
    ? 'knowledge:providers:chat'
    : `knowledge:providers:chat:set:${provider}`;
}

function embeddingCallback(
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  provider: EmbeddingProvider,
): string {
  return settings?.embeddingProvider === provider
    ? 'knowledge:providers:embedding'
    : `knowledge:providers:embedding:set:${provider}`;
}

function modelCallback(
  settings: KnowledgeProviderSettingsSnapshot | undefined,
  model: string,
): string {
  return settings?.embeddingModel === model
    ? 'knowledge:providers:model'
    : `knowledge:providers:model:set:${model}`;
}

function providerKey(provider: string): string {
  return `knowledge-management.menu.provider_${provider}`;
}

function modelKey(model: string): string {
  if (model === 'text-embedding-3-small') return 'knowledge-management.menu.model_openai_small';
  if (model === 'text-embedding-3-large') return 'knowledge-management.menu.model_openai_large';
  if (model === 'embeddinggemma') return 'knowledge-management.menu.model_ollama_embeddinggemma';
  return 'knowledge-management.menu.model_gemini_v2';
}
