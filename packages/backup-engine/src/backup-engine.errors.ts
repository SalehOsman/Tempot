export const BACKUP_ENGINE_ERRORS = {
  INVALID_ACTOR: 'backup-engine.invalid_actor',
  INVALID_SOURCE_ENVIRONMENT: 'backup-engine.invalid_source_environment',
  ACTIVE_JOB_EXISTS: 'backup-engine.active_job_exists',
  UNSAFE_METADATA: 'backup-engine.unsafe_metadata',
  INVALID_RETENTION: 'backup-engine.invalid_retention',
  INVALID_BACKUP_JOB: 'backup-engine.invalid_backup_job',
  BACKUP_NOT_FOUND: 'backup-engine.backup_not_found',
  INVALID_LIST_LIMIT: 'backup-engine.invalid_list_limit',
  INVALID_CONFIRMATION_ACTOR: 'backup-engine.invalid_confirmation_actor',
  INVALID_RESTORE_TARGET: 'backup-engine.invalid_restore_target',
  LIVE_RESTORE_TARGET: 'backup-engine.live_restore_target',
  QUEUE_ENQUEUE_FAILED: 'backup-engine.queue_enqueue_failed',
  BACKUP_EXECUTION_FAILED: 'backup-engine.backup_execution_failed',
  INVALID_BACKUP_OUTPUT: 'backup-engine.invalid_backup_output',
  INVALID_DATABASE_URL: 'backup-engine.invalid_database_url',
  INVALID_ENCRYPTION_KEY: 'backup-engine.invalid_encryption_key',
  ARTIFACT_DECRYPT_FAILED: 'backup-engine.artifact_decrypt_failed',
  BACKUP_ARTIFACT_NOT_FOUND: 'backup-engine.backup_artifact_not_found',
  RESTORE_REHEARSAL_FAILED: 'backup-engine.restore_rehearsal_failed',
  RESTORE_REHEARSAL_REQUIRED: 'backup-engine.restore_rehearsal_required',
  PRODUCTION_RESTORE_FAILED: 'backup-engine.production_restore_failed',
  DATABASE_FACTORY_RESET_FAILED: 'backup-engine.database_factory_reset_failed',
} as const;

export type BackupEngineErrorCode =
  (typeof BACKUP_ENGINE_ERRORS)[keyof typeof BACKUP_ENGINE_ERRORS];
