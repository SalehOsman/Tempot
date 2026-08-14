import { err, ok } from 'neverthrow';
import { AppError, queueFactory } from '@tempot/shared';
import type { AsyncResult, Result } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type { BackupJob, BackupQueuePort } from './backup-engine.types.js';

export const BACKUP_QUEUE_NAME = 'backup-engine';
export const BACKUP_QUEUE_JOB_NAME = 'backup.execute';

const QUEUE_ATTEMPTS = 3;
const QUEUE_BACKOFF_DELAY_MS = 1000;

export interface QueueJobOptions {
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

export interface QueueLike {
  add(name: string, data: BackupJob, options: QueueJobOptions): Promise<unknown>;
}

export class BackupQueue implements BackupQueuePort {
  constructor(private readonly queue: QueueLike) {}

  async enqueueBackupJob(job: BackupJob): AsyncResult<void> {
    try {
      await this.queue.add(BACKUP_QUEUE_JOB_NAME, job, {
        attempts: QUEUE_ATTEMPTS,
        backoff: { type: 'exponential', delay: QUEUE_BACKOFF_DELAY_MS },
        removeOnComplete: true,
        removeOnFail: false,
      });
      return ok(undefined);
    } catch (error) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED, error));
    }
  }
}

export interface BackupQueueFactoryDeps {
  queueFactory?: (name: string) => Result<QueueLike>;
}

export function createBackupQueue(deps: BackupQueueFactoryDeps = {}): Result<BackupQueue> {
  const createQueue = deps.queueFactory ?? queueFactory;
  const queueResult = createQueue(BACKUP_QUEUE_NAME);
  if (queueResult.isErr()) return err(queueResult.error);
  return ok(new BackupQueue(queueResult.value));
}
