import { err, ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type {
  BackupJob,
  BackupQueueServiceDeps,
  BackupRequestCommand,
} from './backup-engine.types.js';

export class BackupQueueService {
  constructor(private readonly deps: BackupQueueServiceDeps) {}

  async requestQueuedBackup(command: BackupRequestCommand): AsyncResult<BackupJob> {
    const backupResult = await this.deps.backupEngine.requestBackup(command);
    if (backupResult.isErr()) return err(backupResult.error);

    const enqueueResult = await this.deps.queue.enqueueBackupJob(backupResult.value);
    if (enqueueResult.isErr()) return err(enqueueResult.error);

    return ok(backupResult.value);
  }
}
