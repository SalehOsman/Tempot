import type {
  IngestionSummary,
  KnowledgeSourceProfile,
  RagReadinessSnapshot,
} from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export function formatStatus(t: TranslationFn, status: RagReadinessSnapshot): string {
  return t('knowledge-management.view.status', {
    ai: boolLabel(t, status.aiEnabled),
    provider: boolLabel(t, status.providerConfigured),
    chatProvider: status.chatProvider ?? '',
    chatProviderReady: boolLabel(t, status.chatProviderConfigured ?? false),
    embeddingProvider: status.embeddingProvider ?? '',
    embeddingModel: status.embeddingModel ?? '',
    database: boolLabel(t, status.databaseConfigured),
    vector: boolLabel(t, status.vectorReady),
    embeddings: status.embeddingsCount,
    mounted: `${status.mountedProfiles}/${status.profileCount}`,
  });
}

export function formatProfile(
  t: TranslationFn,
  profile: KnowledgeSourceProfile,
  index: number,
): string {
  return t('knowledge-management.view.source_item', {
    index,
    name: profileName(t, profile),
    roots: profile.rootLabels.join(', '),
    mounted: boolLabel(t, profile.mounted),
  });
}

export function profileName(t: TranslationFn, profile: KnowledgeSourceProfile): string {
  return profile.displayName ?? t(profile.labelKey);
}

export function formatSummary(
  t: TranslationFn,
  titleKey: string,
  summary: IngestionSummary,
): string {
  return t(titleKey, {
    id: summary.jobId,
    profile: summary.profileId,
    processed: summary.processed,
    skipped: summary.skipped,
    failed: summary.failed,
    chunks: summary.chunks,
  });
}

export function boolLabel(t: TranslationFn, value: boolean): string {
  return t(value ? 'knowledge-management.value.yes' : 'knowledge-management.value.no');
}

export function failureReason(t: TranslationFn, reason: string | undefined): string {
  if (reason === 'quota_exceeded') return t('knowledge-management.reason.quota_exceeded');
  if (reason === 'embedding_failed') return t('knowledge-management.reason.embedding_failed');
  if (reason === 'database_failed') return t('knowledge-management.reason.database_failed');
  return t('knowledge-management.reason.unknown');
}
