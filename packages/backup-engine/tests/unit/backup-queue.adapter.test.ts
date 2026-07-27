import { describe, expect, it } from 'vitest';
import {
  BACKUP_ENGINE_ERRORS,
  BACKUP_QUEUE_JOB_NAME,
  BackupQueue,
  type BackupJob,
  type QueueLike,
} from '../../src/index.js';

const backupJob: BackupJob = {
  id: 'backup-1',
  requestedBy: 'super-admin-1',
  scope: 'complete',
  status: 'pending',
  sourceEnvironment: 'local-staging',
  requestedAt: '2026-07-27T00:00:00.000Z',
};

describe('BackupQueue', () => {
  it('should enqueue backup jobs with the standard job name and retry options', async () => {
    const calls: Array<{ name: string; data: BackupJob; options: unknown }> = [];
    const queue: QueueLike = {
      add: async (name, data, options) => {
        calls.push({ name, data, options });
      },
    };
    const backupQueue = new BackupQueue(queue);

    const result = await backupQueue.enqueueBackupJob(backupJob);

    expect(result.isOk()).toBe(true);
    expect(calls[0]).toMatchObject({
      name: BACKUP_QUEUE_JOB_NAME,
      data: backupJob,
      options: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  });

  it('should return an AppError when queue enqueue fails', async () => {
    const queue: QueueLike = {
      add: async () => {
        throw new Error('queue unavailable');
      },
    };
    const backupQueue = new BackupQueue(queue);

    const result = await backupQueue.enqueueBackupJob(backupJob);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED);
  });
});
