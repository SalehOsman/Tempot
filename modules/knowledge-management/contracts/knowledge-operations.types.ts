export type KnowledgeOperationResult<T> =
  | { success: true; value: T }
  | { success: false; error: { code: string } };

export interface KnowledgeSourceProfile {
  readonly id: string;
  readonly labelKey: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly rootLabels: readonly string[];
  readonly contentType: string;
  readonly languagePolicy: string;
  readonly sourcePriority: number;
  readonly sourceOfTruth: boolean;
  readonly mounted: boolean;
  readonly custom: boolean;
}

export interface KnowledgeCustomProfileInput {
  readonly name: string;
  readonly description: string;
  readonly root: string;
}

export interface RagReadinessSnapshot {
  readonly aiEnabled: boolean;
  readonly providerConfigured: boolean;
  readonly databaseConfigured: boolean;
  readonly vectorReady: boolean;
  readonly embeddingsCount: number;
  readonly mountedProfiles: number;
  readonly profileCount: number;
}

export interface IngestionSummary {
  readonly jobId: string;
  readonly profileId: string;
  readonly mode: 'dry-run' | 'write' | 'full-reindex';
  readonly status: 'succeeded' | 'failed';
  readonly processed: number;
  readonly skipped: number;
  readonly failed: number;
  readonly chunks: number;
  readonly hashesWritten: boolean;
}

export interface WriteConfirmation {
  readonly token: string;
  readonly profileId: string;
  readonly summary: IngestionSummary;
}

export interface RagTestQueryResult {
  readonly state: 'answered' | 'no-context' | 'degraded';
  readonly resultCount: number;
  readonly citations: readonly string[];
}

export interface KnowledgeOperationsProvider {
  getReadiness(actorId: string): Promise<KnowledgeOperationResult<RagReadinessSnapshot>>;
  listSourceProfiles(actorId: string): Promise<KnowledgeOperationResult<KnowledgeSourceProfile[]>>;
  addCustomProfile(
    actorId: string,
    input: KnowledgeCustomProfileInput,
  ): Promise<KnowledgeOperationResult<KnowledgeSourceProfile>>;
  runDryRun(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<IngestionSummary>>;
  requestWrite(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<WriteConfirmation>>;
  confirmWrite(actorId: string, token: string): Promise<KnowledgeOperationResult<IngestionSummary>>;
  requestFullReindex(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<WriteConfirmation>>;
  confirmFullReindex(
    actorId: string,
    token: string,
  ): Promise<KnowledgeOperationResult<IngestionSummary>>;
  listJobs(actorId: string, limit: number): Promise<KnowledgeOperationResult<IngestionSummary[]>>;
  testQuery(
    actorId: string,
    question: string,
    profileId?: string,
  ): Promise<KnowledgeOperationResult<RagTestQueryResult>>;
}
