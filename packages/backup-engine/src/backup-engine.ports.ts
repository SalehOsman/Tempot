import type { AsyncResult } from '@tempot/shared';
import type { BackupArtifactType } from './backup-engine.types.js';

export const BACKUP_LIFECYCLE_EVENTS = {
  JOB_REQUESTED: 'backup.job.requested',
  JOB_STARTED: 'backup.job.started',
  JOB_SUCCEEDED: 'backup.job.succeeded',
  JOB_FAILED: 'backup.job.failed',
  JOB_WARNING: 'backup.job.warning',
  RESTORE_REHEARSAL_REQUESTED: 'restore.rehearsal.requested',
  RESTORE_REHEARSAL_PASSED: 'restore.rehearsal.passed',
  RESTORE_REHEARSAL_FAILED: 'restore.rehearsal.failed',
  PRODUCTION_RESTORE_REQUESTED: 'restore.production.requested',
  PRODUCTION_RESTORE_SUCCEEDED: 'restore.production.succeeded',
  PRODUCTION_RESTORE_FAILED: 'restore.production.failed',
  DATABASE_FACTORY_RESET_REQUESTED: 'database.factory_reset.requested',
  DATABASE_FACTORY_RESET_SUCCEEDED: 'database.factory_reset.succeeded',
  DATABASE_FACTORY_RESET_FAILED: 'database.factory_reset.failed',
  RETENTION_EXECUTED: 'backup.retention.executed',
} as const;

export type BackupLifecycleEventName =
  (typeof BACKUP_LIFECYCLE_EVENTS)[keyof typeof BACKUP_LIFECYCLE_EVENTS];

export interface BackupArtifactStoreRequest {
  backupJobId: string;
  artifactName: string;
  artifactType: BackupArtifactType;
  contentType: string;
  checksum: string;
  data: Buffer;
  encrypted: boolean;
  sizeBytes: number;
}

export interface BackupArtifactStoreReceipt {
  storageReference: string;
  sizeBytes: number;
  checksum: string;
}

export interface BackupStoragePort {
  storeArtifact(request: BackupArtifactStoreRequest): AsyncResult<BackupArtifactStoreReceipt>;
  loadArtifact(storageReference: string): AsyncResult<Buffer>;
}

export interface BackupNotificationRequest {
  templateKey: string;
  metadata: Readonly<Record<string, string>>;
}

export interface BackupNotifierPort {
  notify(request: BackupNotificationRequest): AsyncResult<void>;
}

export interface BackupEventPublisher {
  publish(
    event: BackupLifecycleEventName,
    payload: Readonly<Record<string, unknown>>,
  ): AsyncResult<void>;
}

export interface BackupSettingsPort {
  getBackupSchedule(): AsyncResult<string>;
}

export interface BackupAuditRecord {
  action: string;
  status: 'succeeded' | 'failed' | 'warning';
}

export interface BackupAuditPort {
  record(record: BackupAuditRecord): AsyncResult<void>;
}
