import type {
  KnowledgeChatProvider,
  KnowledgeEmbeddingModel,
  KnowledgeEmbeddingProvider,
} from '../contracts/knowledge-operations.types.js';
import type { KnowledgeView, ResolveContext } from './knowledge-view.types.js';

export function isProviderSettingsCallback(callbackData: string): boolean {
  return callbackData.startsWith('knowledge:providers');
}

export async function resolveProviderSettingsView(
  context: ResolveContext,
  callbackData: string,
): Promise<KnowledgeView> {
  if (callbackData === 'knowledge:providers') return providerSettings(context, 'providers');
  if (callbackData === 'knowledge:providers:chat')
    return providerSettings(context, 'chat-providers');
  if (callbackData === 'knowledge:providers:embedding') {
    return providerSettings(context, 'embedding-providers');
  }
  if (callbackData === 'knowledge:providers:model')
    return providerSettings(context, 'embedding-models');
  if (callbackData.startsWith('knowledge:providers:chat:set:'))
    return setChat(context, callbackData);
  if (callbackData.startsWith('knowledge:providers:embedding:set:')) {
    return setEmbedding(context, callbackData);
  }
  if (callbackData.startsWith('knowledge:providers:model:set:'))
    return setModel(context, callbackData);
  return providerSettings(context, 'providers');
}

async function providerSettings(
  context: ResolveContext,
  surface: KnowledgeView['surface'],
): Promise<KnowledgeView> {
  const view = await context.service.renderProviderSettingsView(context.t, context.actorId);
  return {
    text: view.text,
    providerSettings: view.providerSettings,
    surface,
  };
}

async function setChat(context: ResolveContext, callbackData: string): Promise<KnowledgeView> {
  const provider = parseChatProvider(callbackData.replace('knowledge:providers:chat:set:', ''));
  if (!provider) return failed(context);
  return {
    text: await context.service.renderSetChatProvider(context.t, context.actorId, provider),
    surface: 'providers',
  };
}

async function setEmbedding(context: ResolveContext, callbackData: string): Promise<KnowledgeView> {
  const provider = parseEmbeddingProvider(
    callbackData.replace('knowledge:providers:embedding:set:', ''),
  );
  if (!provider) return failed(context);
  return {
    text: await context.service.renderSetEmbeddingProvider(context.t, context.actorId, provider),
    surface: 'providers',
  };
}

async function setModel(context: ResolveContext, callbackData: string): Promise<KnowledgeView> {
  const model = parseEmbeddingModel(callbackData.replace('knowledge:providers:model:set:', ''));
  if (!model) return failed(context);
  return {
    text: await context.service.renderSetEmbeddingModel(context.t, context.actorId, model),
    surface: 'providers',
  };
}

function failed(context: ResolveContext): KnowledgeView {
  return {
    text: context.t('knowledge-management.view.provider_update_failed'),
    surface: 'providers',
  };
}

function parseChatProvider(value: string): KnowledgeChatProvider | null {
  if (value === 'gemini' || value === 'openai' || value === 'deepseek') return value;
  return null;
}

function parseEmbeddingProvider(value: string): KnowledgeEmbeddingProvider | null {
  if (value === 'gemini' || value === 'openai') return value;
  return null;
}

function parseEmbeddingModel(value: string): KnowledgeEmbeddingModel | null {
  if (value === 'gemini-embedding-2-preview') return value;
  if (value === 'gemini-embedding-2') return value;
  if (value === 'text-embedding-3-small') return value;
  if (value === 'text-embedding-3-large') return value;
  return null;
}
