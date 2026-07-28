import type {
  IngestionSummary,
  KnowledgeOperationsProvider,
  KnowledgeSourceProfile,
  RagReadinessSnapshot,
} from '../contracts/knowledge-operations.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export class KnowledgeViewService {
  constructor(private readonly provider: KnowledgeOperationsProvider | undefined) {}

  async renderStatus(t: TranslationFn, actorId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.getReadiness(actorId);
    if (!result.success) return t('knowledge-management.view.status_failed');
    return formatStatus(t, result.value);
  }

  async renderSources(t: TranslationFn, actorId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.listSourceProfiles(actorId);
    if (!result.success) return t('knowledge-management.view.sources_failed');
    if (result.value.length === 0) return t('knowledge-management.view.sources_empty');
    return [
      t('knowledge-management.view.sources_title', { count: result.value.length }),
      ...result.value.map((profile, index) => formatProfile(t, profile, index + 1)),
    ].join('\n');
  }

  async renderDryRun(t: TranslationFn, actorId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.runDryRun(actorId, 'product-help');
    if (!result.success) return t('knowledge-management.view.dry_run_failed');
    return formatSummary(t, 'knowledge-management.view.dry_run_completed', result.value);
  }

  async renderHistory(t: TranslationFn, actorId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.listJobs(actorId, 5);
    if (!result.success) return t('knowledge-management.view.history_failed');
    if (result.value.length === 0) return t('knowledge-management.view.history_empty');
    const lines = result.value.map((job, index) =>
      t('knowledge-management.view.history_item', { index: index + 1, id: job.jobId }),
    );
    return [t('knowledge-management.view.history_title'), ...lines].join('\n');
  }

  async renderWriteRequest(
    t: TranslationFn,
    actorId: string,
  ): Promise<{ text: string; token?: string }> {
    if (!this.provider) return { text: t('knowledge-management.view.unavailable') };
    const result = await this.provider.requestWrite(actorId, 'product-help');
    if (!result.success) return { text: t('knowledge-management.view.write_blocked') };
    return {
      token: result.value.token,
      text: formatSummary(t, 'knowledge-management.view.write_confirm', result.value.summary),
    };
  }

  async renderConfirmWrite(t: TranslationFn, actorId: string, token: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.confirmWrite(actorId, token);
    if (!result.success) return t('knowledge-management.view.write_failed');
    return formatSummary(t, 'knowledge-management.view.write_completed', result.value);
  }
}

function formatStatus(t: TranslationFn, status: RagReadinessSnapshot): string {
  return t('knowledge-management.view.status', {
    ai: boolLabel(t, status.aiEnabled),
    provider: boolLabel(t, status.providerConfigured),
    database: boolLabel(t, status.databaseConfigured),
    vector: boolLabel(t, status.vectorReady),
    embeddings: status.embeddingsCount,
    mounted: `${status.mountedProfiles}/${status.profileCount}`,
  });
}

function formatProfile(t: TranslationFn, profile: KnowledgeSourceProfile, index: number): string {
  return t('knowledge-management.view.source_item', {
    index,
    name: t(profile.labelKey),
    roots: profile.rootLabels.join(', '),
    mounted: boolLabel(t, profile.mounted),
  });
}

function formatSummary(t: TranslationFn, titleKey: string, summary: IngestionSummary): string {
  return t(titleKey, {
    id: summary.jobId,
    profile: summary.profileId,
    processed: summary.processed,
    skipped: summary.skipped,
    failed: summary.failed,
    chunks: summary.chunks,
  });
}

function boolLabel(t: TranslationFn, value: boolean): string {
  return t(value ? 'knowledge-management.value.yes' : 'knowledge-management.value.no');
}
