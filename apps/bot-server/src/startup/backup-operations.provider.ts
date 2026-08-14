import { type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AuditLogRepository } from '@tempot/database';
import {
  BACKUP_LIFECYCLE_EVENTS,
  BACKUP_ENGINE_ERRORS,
  BackupEngineService,
  BackupExecutionService,
  RestoreExecutionService,
} from '@tempot/backup-engine';
import type { BackupOperationResult, BackupOperationsProvider } from '../bot-server.types.js';
import {
  buildBackupConfig,
  buildRestoreConfig,
  resolveBackupSourceEnvironment,
} from './backup-operations.config.js';
import { restoreProductionBackup } from './backup-production-restore.provider.js';
import { factoryResetDatabase } from './backup-factory-reset.provider.js';
import { createBackupRuntime } from './backup-runtime.factory.js';

const DEFAULT_BACKUP_SCOPE = 'complete';

interface BackupOperationsProviderDeps {
  auditLogRepository: AuditLogRepository;
  eventBus: { publish: (event: string, payload: Record<string, unknown>) => Promise<unknown> };
  logger: { warn: (data: Record<string, unknown>) => void };
}

export function buildBackupOperationsProvider(
  deps: BackupOperationsProviderDeps,
): BackupOperationsProvider {
  const runtime = createBackupRuntime(deps.auditLogRepository);
  return {
    requestBackup: async (actorId: string) =>
      requestBackup({
        actorId,
        backupEngine: runtime.backupEngine,
        backupExecution: runtime.backupExecution,
        deps,
      }),
    listBackups: async (limit: number) =>
      toBackupOperationResult(await runtime.backupEngine.listBackups({ limit })),
    restoreLatest: async (actorId: string) =>
      restoreLatest({
        actorId,
        backupEngine: runtime.backupEngine,
        restoreExecution: runtime.restoreExecution,
        deps,
      }),
    restoreBackup: async (backupJobId: string, actorId: string) =>
      restoreBackup({
        actorId,
        backupEngine: runtime.backupEngine,
        backupJobId,
        restoreExecution: runtime.restoreExecution,
        deps,
      }),
    restoreProductionBackup: async (backupJobId: string, actorId: string) =>
      restoreProductionBackup({
        actorId,
        backupEngine: runtime.backupEngine,
        backupExecution: runtime.backupExecution,
        backupJobId,
        deps,
        productionRestoreExecution: runtime.productionRestoreExecution,
      }),
    factoryResetDatabase: async (actorId: string) =>
      factoryResetDatabase({
        actorId,
        backupEngine: runtime.backupEngine,
        backupExecution: runtime.backupExecution,
        databaseFactoryReset: runtime.databaseFactoryReset,
        deps,
      }),
  };
}

interface RequestBackupInput {
  actorId: string;
  backupEngine: BackupEngineService;
  backupExecution: BackupExecutionService;
  deps: BackupOperationsProviderDeps;
}

async function requestBackup(input: RequestBackupInput) {
  const result = await input.backupEngine.requestBackup({
    actorId: input.actorId,
    scope: DEFAULT_BACKUP_SCOPE,
    sourceEnvironment: resolveBackupSourceEnvironment(),
  });
  if (result.isErr()) return { success: false, error: { code: result.error.code } } as const;
  await publishBackupLifecycle(input.deps, BACKUP_LIFECYCLE_EVENTS.JOB_REQUESTED, {
    backupJobId: result.value.id,
    actorId: input.actorId,
  });
  const execution = await input.backupExecution.executeBackup(result.value, buildBackupConfig());
  if (execution.isErr()) {
    await publishBackupLifecycle(input.deps, BACKUP_LIFECYCLE_EVENTS.JOB_FAILED, {
      backupJobId: result.value.id,
      actorId: input.actorId,
      errorCode: execution.error.code,
    });
    return { success: false, error: { code: execution.error.code } } as const;
  }
  await publishBackupLifecycle(input.deps, BACKUP_LIFECYCLE_EVENTS.JOB_SUCCEEDED, {
    backupJobId: result.value.id,
    actorId: input.actorId,
  });
  return {
    success: true,
    value: {
      job: { ...result.value, status: 'succeeded' },
      artifact: execution.value,
      storageReference: execution.value.storageReference,
    },
  } as const;
}

interface RestoreLatestInput {
  actorId: string;
  backupEngine: BackupEngineService;
  restoreExecution: RestoreExecutionService;
  deps: BackupOperationsProviderDeps;
}

async function restoreLatest(input: RestoreLatestInput) {
  const backups = await input.backupEngine.listBackups({ limit: 10 });
  if (backups.isErr()) return { success: false, error: { code: backups.error.code } } as const;

  const latest = backups.value.jobs.find((job) => job.status === 'succeeded');
  if (!latest) {
    return { success: false, error: { code: BACKUP_ENGINE_ERRORS.BACKUP_NOT_FOUND } } as const;
  }

  return restoreBackup({ ...input, backupJobId: latest.id });
}

interface RestoreBackupInput extends RestoreLatestInput {
  backupJobId: string;
}

async function restoreBackup(input: RestoreBackupInput) {
  const backup = await input.backupEngine.getBackup(input.backupJobId);
  if (backup.isErr()) return { success: false, error: { code: backup.error.code } } as const;
  if (backup.value.status !== 'succeeded') {
    return { success: false, error: { code: BACKUP_ENGINE_ERRORS.BACKUP_NOT_FOUND } } as const;
  }

  const result = await input.restoreExecution.runRestoreRehearsal(
    { backupJobId: backup.value.id, confirmedBy: input.actorId },
    buildRestoreConfig(),
  );
  await publishBackupLifecycle(
    input.deps,
    result.isOk()
      ? BACKUP_LIFECYCLE_EVENTS.RESTORE_REHEARSAL_PASSED
      : BACKUP_LIFECYCLE_EVENTS.RESTORE_REHEARSAL_FAILED,
    { backupJobId: backup.value.id, actorId: input.actorId },
  );
  return toBackupOperationResult(result);
}

async function publishBackupLifecycle(
  deps: BackupOperationsProviderDeps,
  event: (typeof BACKUP_LIFECYCLE_EVENTS)[keyof typeof BACKUP_LIFECYCLE_EVENTS],
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await deps.eventBus.publish(event, payload);
  } catch (error: unknown) {
    deps.logger.warn({ msg: 'backup_lifecycle_event_failed', event, error: String(error) });
  }
}

function toBackupOperationResult<T>(result: Result<T, AppError>): BackupOperationResult<T> {
  if (result.isErr()) return { success: false, error: { code: result.error.code } };
  return { success: true, value: result.value };
}
