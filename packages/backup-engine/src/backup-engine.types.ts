import type { AsyncResult } from '@tempot/shared';

export type BackupScope = 'complete' | 'database' | 'files';
export type BackupJobStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'warning'
  | 'cancelled';
export type BackupArtifactType = 'database_dump' | 'storage_snapshot' | 'manifest' | 'evidence';
export type BackupIntegrityStatus = 'pending' | 'passed' | 'failed';
export type RestoreRehearsalStatus = 'pending' | 'running' | 'passed' | 'failed' | 'blocked';

export interface BackupRequestCommand {
  actorId: string;
  scope: BackupScope;
  sourceEnvironment: string;
}

export interface BackupJob {
  id: string;
  requestedBy: string;
  scope: BackupScope;
  status: BackupJobStatus;
  sourceEnvironment: string;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  failureCategory?: string;
  safeFailureMessage?: string;
}

export interface BackupListQuery {
  limit: number;
}

export interface BackupListResult {
  jobs: readonly BackupJob[];
  limit: number;
}

export interface BackupJobRepositoryPort {
  findActiveJob(): AsyncResult<BackupJob | undefined>;
  create(job: BackupJob): AsyncResult<BackupJob>;
  findById(id: string): AsyncResult<BackupJob | undefined>;
  listRecent(limit: number): AsyncResult<readonly BackupJob[]>;
  markRunning(id: string, startedAt: string): AsyncResult<BackupJob>;
  markSucceeded(id: string, completedAt: string): AsyncResult<BackupJob>;
  markFailed(input: BackupJobFailureUpdate): AsyncResult<BackupJob>;
}

export interface BackupJobFailureUpdate {
  id: string;
  completedAt: string;
  failureCategory: string;
  safeFailureMessage?: string;
}

export interface BackupEngineServiceDeps {
  jobs: BackupJobRepositoryPort;
  activeJobStaleAfterMs?: number;
  now?: () => Date;
}

export interface BackupQueuePort {
  enqueueBackupJob(job: BackupJob): AsyncResult<void>;
}

export interface BackupQueueServiceDeps {
  backupEngine: {
    requestBackup(command: BackupRequestCommand): AsyncResult<BackupJob>;
  };
  queue: BackupQueuePort;
}

export interface BackupArtifactInput {
  artifactType: BackupArtifactType;
  checksum: string;
  encrypted: boolean;
  sizeBytes: number;
}

export interface BackupArtifact extends BackupArtifactInput {
  id: string;
  backupJobId: string;
  storageAttachmentId?: string;
  storageReference?: string;
  storageProvider?: string;
}

export interface BackupArtifactRepositoryPort {
  create(artifact: BackupArtifact): AsyncResult<BackupArtifact>;
  findByBackupJobId(backupJobId: string): AsyncResult<readonly BackupArtifact[]>;
}

export interface BackupManifestCommand {
  backupJobId: string;
  scope: BackupScope;
  artifacts: readonly BackupArtifactInput[];
  sourceEnvironment: string;
  migrationState?: string;
  keyVersionReferences?: readonly string[];
}

export interface BackupManifest {
  backupJobId: string;
  schemaVersion: string;
  sourceEnvironment: string;
  databaseIncluded: boolean;
  filesIncluded: boolean;
  protectedDataIncluded: boolean;
  keyVersionReferences: readonly string[];
  migrationState?: string;
  artifactCount: number;
  totalSizeBytes: number;
  integrityStatus: BackupIntegrityStatus;
}

export interface BackupRetentionCandidate {
  artifactId: string;
  backupJobId: string;
  scope: BackupScope;
  createdAt: string;
  isUsableCompleteBackup: boolean;
}

export interface BackupRetentionPreviewCommand {
  candidates: readonly BackupRetentionCandidate[];
  now: Date;
  retentionDays: number;
}

export interface BackupRetentionPreview {
  artifactIdsToDelete: readonly string[];
  protectedArtifactIds: readonly string[];
}

export interface RestoreRehearsalCommand {
  backupJobId: string;
  confirmedBy: string;
  targetClassification: string;
}

export interface RestoreRehearsal {
  id: string;
  backupJobId: string;
  confirmedBy: string;
  targetClassification: string;
  status: RestoreRehearsalStatus;
  requestedAt: string;
  completedAt?: string;
  schemaCheck: BackupIntegrityStatus;
  dataCheck: BackupIntegrityStatus;
  protectedDataCheck: BackupIntegrityStatus;
  fileCoverageCheck: BackupIntegrityStatus;
  safeFailureMessage?: string;
}

export interface RestoreRehearsalRepositoryPort {
  create(rehearsal: RestoreRehearsal): AsyncResult<RestoreRehearsal>;
  findLatestPassedByBackupJobId(backupJobId: string): AsyncResult<RestoreRehearsal | undefined>;
}

export interface RestoreRehearsalServiceDeps {
  rehearsals: RestoreRehearsalRepositoryPort;
}

export interface ProductionRestoreResult {
  id: string;
  backupJobId: string;
  confirmedBy: string;
  preRestoreBackupJobId: string;
  status: 'succeeded';
  requestedAt: string;
  completedAt: string;
}

export interface DatabaseFactoryResetResult {
  id: string;
  confirmedBy: string;
  preResetBackupJobId: string;
  status: 'succeeded';
  requestedAt: string;
  completedAt: string;
}
