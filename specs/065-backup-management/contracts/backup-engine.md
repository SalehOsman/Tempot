# Contract: `@tempot/backup-engine`

## Public Package Contract

All fallible public APIs return `Result<T, AppError>`.

```typescript
type BackupScope = 'complete' | 'database' | 'files';
type BackupStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'warning' | 'cancelled';
type RestoreStatus = 'pending' | 'running' | 'passed' | 'failed' | 'blocked';
```

## BackupEngineService

```typescript
requestBackup(command): ResultAsync<BackupJob, AppError>
getBackup(jobId): ResultAsync<BackupJobDetail, AppError>
listBackups(query): ResultAsync<PaginatedBackups, AppError>
verifyBackup(jobId): ResultAsync<BackupIntegrityResult, AppError>
```

## RestoreRehearsalService

```typescript
requestRestoreRehearsal(command): ResultAsync<RestoreRehearsal, AppError>
getRestoreRehearsal(rehearsalId): ResultAsync<RestoreRehearsalDetail, AppError>
```

## RetentionService

```typescript
previewRetention(policy): ResultAsync<RetentionPreview, AppError>
executeRetention(command): ResultAsync<RetentionResult, AppError>
```

## Required Ports

| Port | Purpose |
| --- | --- |
| `BackupDatabasePort` | Creates database dump artifacts and validates schema/data restore checks. |
| `BackupStoragePort` | Stores encrypted backup artifacts through storage-engine-owned provider contracts. |
| `BackupEncryptionPort` | Encrypts backup artifacts before upload and never exposes key material. |
| `BackupNotifierPort` | Sends safe operator notifications through notifier integration. |
| `BackupAuditPort` | Records audit-capable state changes. |
| `BackupQueuePort` | Runs long operations through the shared queue factory. |
| `BackupSettingsPort` | Reads `backup_schedule` and retention settings from settings. |

## Lifecycle Events

| Event | When |
| --- | --- |
| `backup.job.requested` | Operator requests a backup. |
| `backup.job.started` | Execution begins. |
| `backup.job.succeeded` | Backup and integrity verification pass. |
| `backup.job.failed` | Backup fails. |
| `backup.job.warning` | Backup succeeds with secondary warning. |
| `restore.rehearsal.requested` | Operator requests isolated restore rehearsal. |
| `restore.rehearsal.passed` | Rehearsal succeeds. |
| `restore.rehearsal.failed` | Rehearsal fails. |
| `backup.retention.executed` | Retention changes artifact state. |

Event payloads must contain safe identifiers and operational metadata only.
