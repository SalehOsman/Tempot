import type {
  IngestionSummary,
  KnowledgeOperationsProvider,
  KnowledgeSourceProfile,
  RagReadinessSnapshot,
  KnowledgeCustomProfileInput,
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
    return (await this.renderSourcesView(t, actorId)).text;
  }

  async renderSourcesView(
    t: TranslationFn,
    actorId: string,
  ): Promise<{ text: string; profiles: readonly KnowledgeSourceProfile[] }> {
    if (!this.provider) return { text: t('knowledge-management.view.unavailable'), profiles: [] };
    const result = await this.provider.listSourceProfiles(actorId);
    if (!result.success)
      return { text: t('knowledge-management.view.sources_failed'), profiles: [] };
    if (result.value.length === 0)
      return { text: t('knowledge-management.view.sources_empty'), profiles: [] };
    return {
      profiles: result.value,
      text: [
        t('knowledge-management.view.sources_title', { count: result.value.length }),
        ...result.value.map((profile, index) => formatProfile(t, profile, index + 1)),
      ].join('\n'),
    };
  }

  async renderSourceDetail(t: TranslationFn, actorId: string, profileId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.listSourceProfiles(actorId);
    if (!result.success) return t('knowledge-management.view.sources_failed');
    const profile = result.value.find((item) => item.id === profileId);
    if (!profile) return t('knowledge-management.view.source_missing');
    return t('knowledge-management.view.source_detail', {
      name: profileName(t, profile),
      roots: profile.rootLabels.join(', '),
      mounted: boolLabel(t, profile.mounted),
    });
  }

  async renderDryRun(t: TranslationFn, actorId: string, profileId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.runDryRun(actorId, profileId);
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
    profileId: string,
  ): Promise<{ text: string; token?: string }> {
    if (!this.provider) return { text: t('knowledge-management.view.unavailable') };
    const result = await this.provider.requestWrite(actorId, profileId);
    if (!result.success) return { text: t('knowledge-management.view.write_blocked') };
    return {
      token: result.value.token,
      text: formatSummary(t, 'knowledge-management.view.write_confirm', result.value.summary),
    };
  }

  async renderWriteIndex(t: TranslationFn, actorId: string, profileId: string): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.writeIndex(actorId, profileId);
    if (!result.success) {
      return t('knowledge-management.view.write_failed_reason', {
        reason: failureReason(t, result.error.reason),
      });
    }
    return formatSummary(t, 'knowledge-management.view.write_completed', result.value);
  }

  async renderCustomCreated(
    t: TranslationFn,
    actorId: string,
    input: KnowledgeCustomProfileInput,
  ): Promise<string> {
    if (!this.provider) return t('knowledge-management.view.unavailable');
    const result = await this.provider.addCustomProfile(actorId, input);
    if (!result.success) return t('knowledge-management.view.custom_failed');
    return t('knowledge-management.view.custom_created', {
      name: profileName(t, result.value),
      root: result.value.rootLabels.join(', '),
    });
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
    name: profileName(t, profile),
    roots: profile.rootLabels.join(', '),
    mounted: boolLabel(t, profile.mounted),
  });
}

function profileName(t: TranslationFn, profile: KnowledgeSourceProfile): string {
  return profile.displayName ?? t(profile.labelKey);
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

function failureReason(t: TranslationFn, reason: string | undefined): string {
  if (reason === 'embedding_failed') return t('knowledge-management.reason.embedding_failed');
  if (reason === 'database_failed') return t('knowledge-management.reason.database_failed');
  return t('knowledge-management.reason.unknown');
}
