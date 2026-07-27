import { type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  BACKUP_LIFECYCLE_EVENTS,
  BackupEngineService,
  BackupExecutionService,
  DatabaseFactoryResetService,
} from '@tempot/backup-engine';
import type { BackupOperationResult } from '../bot-server.types.js';
import {
  buildBackupConfig,
  buildDatabaseFactoryResetConfig,
  resolveBackupSourceEnvironment,
} from './backup-operations.config.js';

const DEFAULT_BACKUP_SCOPE = 'complete';

interface FactoryResetProviderInput {
  actorId: string;
  backupEngine: BackupEngineService;
  backupExecution: BackupExecutionService;
  databaseFactoryReset: DatabaseFactoryResetService;
  deps: {
    eventBus: { publish: (event: string, payload: Record<string, unknown>) => Promise<unknown> };
    logger: { warn: (data: Record<string, unknown>) => void };
  };
}

export async function factoryResetDatabase(input: FactoryResetProviderInput) {
  const preResetBackup = await createPreResetBackup(input);
  if (!preResetBackup.success) return preResetBackup;

  await publish(input, BACKUP_LIFECYCLE_EVENTS.DATABASE_FACTORY_RESET_REQUESTED);
  const result = await input.databaseFactoryReset.resetDatabase({
    confirmedBy: input.actorId,
    preResetBackupJobId: preResetBackup.value.job.id,
    ...buildDatabaseFactoryResetConfig(),
  });
  await publish(
    input,
    result.isOk()
      ? BACKUP_LIFECYCLE_EVENTS.DATABASE_FACTORY_RESET_SUCCEEDED
      : BACKUP_LIFECYCLE_EVENTS.DATABASE_FACTORY_RESET_FAILED,
  );
  return toBackupOperationResult(result);
}

async function createPreResetBackup(input: FactoryResetProviderInput) {
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
  input: FactoryResetProviderInput,
  event: (typeof BACKUP_LIFECYCLE_EVENTS)[keyof typeof BACKUP_LIFECYCLE_EVENTS],
): Promise<void> {
  try {
    await input.deps.eventBus.publish(event, { actorId: input.actorId });
  } catch (error: unknown) {
    input.deps.logger.warn({ msg: 'backup_lifecycle_event_failed', event, error: String(error) });
  }
}

function toBackupOperationResult<T>(result: Result<T, AppError>): BackupOperationResult<T> {
  if (result.isErr()) return { success: false, error: { code: result.error.code } };
  return { success: true, value: result.value };
}
