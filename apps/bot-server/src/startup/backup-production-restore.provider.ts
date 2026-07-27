import { type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  BACKUP_ENGINE_ERRORS,
  BACKUP_LIFECYCLE_EVENTS,
  BackupEngineService,
  BackupExecutionService,
  ProductionRestoreExecutionService,
} from '@tempot/backup-engine';
import type { BackupOperationResult } from '../bot-server.types.js';
import {
  buildBackupConfig,
  buildProductionRestoreConfig,
  resolveBackupSourceEnvironment,
} from './backup-operations.config.js';

const DEFAULT_BACKUP_SCOPE = 'complete';

interface ProductionRestoreProviderInput {
  actorId: string;
  backupEngine: BackupEngineService;
  backupExecution: BackupExecutionService;
  backupJobId: string;
  deps: {
    eventBus: { publish: (event: string, payload: Record<string, unknown>) => Promise<unknown> };
    logger: { warn: (data: Record<string, unknown>) => void };
  };
  productionRestoreExecution: ProductionRestoreExecutionService;
}

export async function restoreProductionBackup(input: ProductionRestoreProviderInput) {
  const backup = await input.backupEngine.getBackup(input.backupJobId);
  if (backup.isErr()) return { success: false, error: { code: backup.error.code } } as const;
  if (backup.value.status !== 'succeeded') {
    return { success: false, error: { code: BACKUP_ENGINE_ERRORS.BACKUP_NOT_FOUND } } as const;
  }

  const preRestoreBackup = await createPreRestoreBackup(input);
  if (!preRestoreBackup.success) return preRestoreBackup;

  await publish(input, BACKUP_LIFECYCLE_EVENTS.PRODUCTION_RESTORE_REQUESTED);
  const result = await input.productionRestoreExecution.runProductionRestore(
    {
      backupJobId: backup.value.id,
      confirmedBy: input.actorId,
      preRestoreBackupJobId: preRestoreBackup.value.job.id,
    },
    buildProductionRestoreConfig(),
  );
  await publish(
    input,
    result.isOk()
      ? BACKUP_LIFECYCLE_EVENTS.PRODUCTION_RESTORE_SUCCEEDED
      : BACKUP_LIFECYCLE_EVENTS.PRODUCTION_RESTORE_FAILED,
  );
  return toBackupOperationResult(result);
}

async function createPreRestoreBackup(input: ProductionRestoreProviderInput) {
  const job = await input.backupEngine.requestBackup({
    actorId: input.actorId,
    scope: DEFAULT_BACKUP_SCOPE,
    sourceEnvironment: resolveBackupSourceEnvironment(),
  });
  if (job.isErr()) return { success: false, error: { code: job.error.code } } as const;
  const execution = await input.backupExecution.executeBackup(job.value, buildBackupConfig());
  if (execution.isErr()) return { success: false, error: { code: execution.error.code } } as const;
  return {
    success: true,
    value: {
      job: { ...job.value, status: 'succeeded' },
      artifact: execution.value,
      storageReference: execution.value.storageReference,
    },
  } as const;
}

async function publish(
  input: ProductionRestoreProviderInput,
  event: (typeof BACKUP_LIFECYCLE_EVENTS)[keyof typeof BACKUP_LIFECYCLE_EVENTS],
): Promise<void> {
  try {
    await input.deps.eventBus.publish(event, {
      backupJobId: input.backupJobId,
      actorId: input.actorId,
    });
  } catch (error: unknown) {
    input.deps.logger.warn({ msg: 'backup_lifecycle_event_failed', event, error: String(error) });
  }
}

function toBackupOperationResult<T>(result: Result<T, AppError>): BackupOperationResult<T> {
  if (result.isErr()) return { success: false, error: { code: result.error.code } };
  return { success: true, value: result.value };
}
