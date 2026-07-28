import type {
  BackupArtifact,
  BackupJob,
  BackupListResult,
  DatabaseFactoryResetResult,
  ProductionRestoreResult,
  RestoreRehearsal,
} from '@tempot/backup-engine';
import type { UserRole } from '@tempot/module-registry';

export type BackupOperationResult<T> =
  | {
      success: true;
      value: T;
    }
  | {
      success: false;
      error: { code: string };
    };

export interface BackupOperationsProvider {
  requestBackup: (actorId: string) => Promise<
    BackupOperationResult<{
      job: BackupJob;
      artifact?: BackupArtifact;
      storageReference?: string;
    }>
  >;
  listBackups: (limit: number) => Promise<BackupOperationResult<BackupListResult>>;
  restoreLatest: (actorId: string) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreProductionBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<ProductionRestoreResult>>;
  factoryResetDatabase: (
    actorId: string,
  ) => Promise<BackupOperationResult<DatabaseFactoryResetResult>>;
}

export interface HelpAssistantQuestion {
  question: string;
  userId: string;
  chatId: string;
  role: UserRole;
  locale: string;
}

export interface HelpAssistantAnswer {
  state: 'answered' | 'no-context' | 'degraded';
  answer: string;
  citations: readonly { blockId: string; sourceId?: string }[];
  confidence: number;
}

export type HelpAssistantResult =
  | { success: true; value: HelpAssistantAnswer }
  | { success: false; error: { code: string } };

export interface HelpAssistantProvider {
  ask(input: HelpAssistantQuestion): Promise<HelpAssistantResult>;
}

export type KnowledgeOperationResult<T> =
  | { success: true; value: T }
  | { success: false; error: { code: string; reason?: string } };

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

export interface KnowledgeIngestionSummary {
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

export interface KnowledgeWriteConfirmation {
  readonly token: string;
  readonly profileId: string;
  readonly summary: KnowledgeIngestionSummary;
}

export interface KnowledgeTestQueryResult {
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
  ): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>>;
  requestWrite(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<KnowledgeWriteConfirmation>>;
  writeIndex(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>>;
  confirmWrite(
    actorId: string,
    token: string,
  ): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>>;
  requestFullReindex(
    actorId: string,
    profileId: string,
  ): Promise<KnowledgeOperationResult<KnowledgeWriteConfirmation>>;
  confirmFullReindex(
    actorId: string,
    token: string,
  ): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>>;
  listJobs(
    actorId: string,
    limit: number,
  ): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary[]>>;
  testQuery(
    actorId: string,
    question: string,
    profileId?: string,
  ): Promise<KnowledgeOperationResult<KnowledgeTestQueryResult>>;
}
