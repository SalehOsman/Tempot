import type {
  KnowledgeChatProvider,
  KnowledgeEmbeddingModel,
  KnowledgeEmbeddingProvider,
  KnowledgeOperationResult,
  KnowledgeProviderSettingsSnapshot,
} from '../module-providers.types.js';
import type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';

export async function readProviderSettings(
  deps: KnowledgeProviderDeps,
): Promise<KnowledgeOperationResult<KnowledgeProviderSettingsSnapshot>> {
  try {
    return okValue(await deps.providerSettings());
  } catch (error) {
    deps.logger.warn({ msg: 'knowledge_provider_settings_failed', error: safeError(error) });
    return fail('knowledge.provider_settings_failed');
  }
}

export async function updateChatProvider(
  deps: KnowledgeProviderDeps,
  actorId: string,
  provider: KnowledgeChatProvider,
): Promise<KnowledgeOperationResult<void>> {
  const saved = await deps.setChatProvider(provider, actorId);
  return saved ? okValue(undefined) : fail('knowledge.provider_update_failed');
}

export async function updateEmbeddingProvider(
  deps: KnowledgeProviderDeps,
  actorId: string,
  provider: KnowledgeEmbeddingProvider,
): Promise<KnowledgeOperationResult<void>> {
  const saved = await deps.setEmbeddingProvider(provider, actorId);
  return saved ? okValue(undefined) : fail('knowledge.provider_update_failed');
}

export async function updateEmbeddingModel(
  deps: KnowledgeProviderDeps,
  actorId: string,
  model: KnowledgeEmbeddingModel,
): Promise<KnowledgeOperationResult<void>> {
  const saved = await deps.setEmbeddingModel(model, actorId);
  return saved ? okValue(undefined) : fail('knowledge.provider_update_failed');
}

function okValue<T>(value: T): KnowledgeOperationResult<T> {
  return { success: true as const, value };
}

function fail<T>(code: string): KnowledgeOperationResult<T> {
  return { success: false as const, error: { code } };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
