import type {
  KnowledgeChatProvider,
  KnowledgeEmbeddingModel,
  KnowledgeEmbeddingProvider,
  KnowledgeOperationsProvider,
  KnowledgeProviderSettingsSnapshot,
} from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

interface ProviderViewInput {
  readonly provider: KnowledgeOperationsProvider | undefined;
  readonly t: TranslationFn;
  readonly actorId: string;
}

export interface ProviderSettingsView {
  readonly text: string;
  readonly providerSettings?: KnowledgeProviderSettingsSnapshot;
}

export async function providerSettingsView(
  provider: KnowledgeOperationsProvider | undefined,
  t: TranslationFn,
  actorId: string,
): Promise<string> {
  return (await providerSettingsViewData(provider, t, actorId)).text;
}

export async function providerSettingsViewData(
  provider: KnowledgeOperationsProvider | undefined,
  t: TranslationFn,
  actorId: string,
): Promise<ProviderSettingsView> {
  if (!provider) return { text: t('knowledge-management.view.unavailable') };
  const result = await provider.getProviderSettings(actorId);
  if (!result.success) return { text: t('knowledge-management.view.providers_failed') };
  return {
    providerSettings: result.value,
    text: t('knowledge-management.view.providers', {
      chat: result.value.chatProvider,
      chatReady: boolLabel(t, result.value.chatProviderConfigured),
      embedding: result.value.embeddingProvider,
      embeddingReady: boolLabel(t, result.value.embeddingProviderConfigured),
      model: result.value.embeddingModel,
    }),
  };
}

export async function chatProviderUpdatedView(
  input: ProviderViewInput & {
    readonly nextProvider: KnowledgeChatProvider;
  },
): Promise<string> {
  const { provider, t, actorId, nextProvider } = input;
  if (!provider) return t('knowledge-management.view.unavailable');
  const result = await provider.setChatProvider(actorId, nextProvider);
  if (!result.success) return t('knowledge-management.view.provider_update_failed');
  return t('knowledge-management.view.provider_updated', { provider: nextProvider });
}

export async function embeddingProviderUpdatedView(
  input: ProviderViewInput & {
    readonly nextProvider: KnowledgeEmbeddingProvider;
  },
): Promise<string> {
  const { provider, t, actorId, nextProvider } = input;
  if (!provider) return t('knowledge-management.view.unavailable');
  const result = await provider.setEmbeddingProvider(actorId, nextProvider);
  if (!result.success) return t('knowledge-management.view.provider_update_failed');
  return t('knowledge-management.view.embedding_provider_updated', { provider: nextProvider });
}

export async function embeddingModelUpdatedView(
  input: ProviderViewInput & {
    readonly model: KnowledgeEmbeddingModel;
  },
): Promise<string> {
  const { provider, t, actorId, model } = input;
  if (!provider) return t('knowledge-management.view.unavailable');
  const result = await provider.setEmbeddingModel(actorId, model);
  if (!result.success) return t('knowledge-management.view.provider_update_failed');
  return t('knowledge-management.view.embedding_model_updated', { model });
}

function boolLabel(t: TranslationFn, value: boolean): string {
  return t(value ? 'knowledge-management.value.yes' : 'knowledge-management.value.no');
}
