import type { AIConfig } from '@tempot/ai-core';
import type { SettingsProvider } from '../bot-server.types.js';
import type {
  KnowledgeChatProvider,
  KnowledgeEmbeddingModel,
  KnowledgeEmbeddingProvider,
  KnowledgeProviderSettingsSnapshot,
} from '../module-providers.types.js';

const CHAT_PROVIDER_KEY = 'ai_chat_provider';
const EMBEDDING_PROVIDER_KEY = 'ai_embedding_provider';
const EMBEDDING_MODEL_KEY = 'ai_embedding_model';

export async function resolveKnowledgeAISettings(
  settings: SettingsProvider | undefined,
): Promise<KnowledgeProviderSettingsSnapshot> {
  const chatProvider = await activeChatProvider(settings);
  const embeddingProvider = await activeEmbeddingProvider(settings);
  const embeddingModel = await activeEmbeddingModel(settings, embeddingProvider);
  return {
    chatProvider,
    chatProviderConfigured: chatProviderConfigured(chatProvider),
    embeddingProvider,
    embeddingProviderConfigured: embeddingProviderConfigured(embeddingProvider),
    embeddingModel,
  };
}

export async function applyKnowledgeAISettings(
  config: AIConfig,
  settings: SettingsProvider | undefined,
): Promise<AIConfig> {
  const active = await resolveKnowledgeAISettings(settings);
  return {
    ...config,
    provider: active.chatProvider,
    embeddingProvider: active.embeddingProvider,
    embeddingModel: active.embeddingModel,
  };
}

export async function setKnowledgeChatProvider(
  settings: SettingsProvider | undefined,
  provider: KnowledgeChatProvider,
  actorId: string,
): Promise<boolean> {
  return setSetting({ settings, key: CHAT_PROVIDER_KEY, value: provider, actorId });
}

export async function setKnowledgeEmbeddingProvider(
  settings: SettingsProvider | undefined,
  provider: KnowledgeEmbeddingProvider,
  actorId: string,
): Promise<boolean> {
  const providerSaved = await setSetting({
    settings,
    key: EMBEDDING_PROVIDER_KEY,
    value: provider,
    actorId,
  });
  const modelSaved = await setSetting({
    settings,
    key: EMBEDDING_MODEL_KEY,
    value: defaultModel(provider),
    actorId,
  });
  return providerSaved && modelSaved;
}

export async function setKnowledgeEmbeddingModel(
  settings: SettingsProvider | undefined,
  model: KnowledgeEmbeddingModel,
  actorId: string,
): Promise<boolean> {
  const providerSaved = await setSetting({
    settings,
    key: EMBEDDING_PROVIDER_KEY,
    value: modelProvider(model),
    actorId,
  });
  const modelSaved = await setSetting({
    settings,
    key: EMBEDDING_MODEL_KEY,
    value: model,
    actorId,
  });
  return providerSaved && modelSaved;
}

async function activeChatProvider(
  settings: SettingsProvider | undefined,
): Promise<KnowledgeChatProvider> {
  const stored = await readSetting(settings, CHAT_PROVIDER_KEY);
  return (
    parseChatProvider(stored) ?? parseChatProvider(process.env['TEMPOT_AI_PROVIDER']) ?? 'gemini'
  );
}

async function activeEmbeddingProvider(
  settings: SettingsProvider | undefined,
): Promise<KnowledgeEmbeddingProvider> {
  const stored = await readSetting(settings, EMBEDDING_PROVIDER_KEY);
  return (
    parseEmbeddingProvider(stored) ??
    parseEmbeddingProvider(process.env['AI_EMBEDDING_PROVIDER']) ??
    'gemini'
  );
}

async function activeEmbeddingModel(
  settings: SettingsProvider | undefined,
  provider: KnowledgeEmbeddingProvider,
): Promise<string> {
  const stored = await readSetting(settings, EMBEDDING_MODEL_KEY);
  if (typeof stored === 'string' && stored.trim()) return stored;
  return process.env['AI_EMBEDDING_MODEL'] ?? defaultModel(provider);
}

async function readSetting(settings: SettingsProvider | undefined, key: string): Promise<unknown> {
  if (!settings) return null;
  const value = await settings.get(key);
  return value === 'env' ? null : value;
}

async function setSetting(input: {
  readonly settings: SettingsProvider | undefined;
  readonly key: string;
  readonly value: string;
  readonly actorId: string;
}): Promise<boolean> {
  const { settings, key, value, actorId } = input;
  if (!settings) return false;
  return (await settings.set(key, value, actorId)) !== null;
}

function parseChatProvider(value: unknown): KnowledgeChatProvider | null {
  if (value === 'gemini' || value === 'openai' || value === 'deepseek') return value;
  return null;
}

function parseEmbeddingProvider(value: unknown): KnowledgeEmbeddingProvider | null {
  if (value === 'gemini' || value === 'openai' || value === 'ollama') return value;
  return null;
}

function defaultModel(provider: KnowledgeEmbeddingProvider): KnowledgeEmbeddingModel {
  if (provider === 'ollama') return 'embeddinggemma';
  return provider === 'openai' ? 'text-embedding-3-large' : 'gemini-embedding-2-preview';
}

function modelProvider(model: KnowledgeEmbeddingModel): KnowledgeEmbeddingProvider {
  if (model === 'embeddinggemma') return 'ollama';
  return model.startsWith('text-embedding-3') ? 'openai' : 'gemini';
}

function chatProviderConfigured(provider: KnowledgeChatProvider): boolean {
  if (provider === 'openai') return Boolean(process.env['OPENAI_API_KEY']);
  if (provider === 'deepseek') return Boolean(process.env['DEEPSEEK_API_KEY']);
  return Boolean(process.env['GOOGLE_GENERATIVE_AI_API_KEY']);
}

function embeddingProviderConfigured(provider: KnowledgeEmbeddingProvider): boolean {
  if (provider === 'openai') return Boolean(process.env['OPENAI_API_KEY']);
  if (provider === 'ollama') return Boolean(process.env['OLLAMA_BASE_URL']);
  return Boolean(process.env['GOOGLE_GENERATIVE_AI_API_KEY']);
}
