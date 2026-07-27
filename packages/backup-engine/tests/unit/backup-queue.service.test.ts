import { describe, expect, it } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  BACKUP_ENGINE_ERRORS,
  BackupEngineService,
  BackupQueueService,
  type BackupJob,
  type BackupJobRepositoryPort,
  type BackupQueuePort,
} from '../../src/index.js';

class MemoryJobRepository implements BackupJobRepositoryPort {
  readonly jobs: BackupJob[] = [];

  async findActiveJob() {
    return ok(undefined);
  }

  async create(job: BackupJob) {
    this.jobs.push(job);
    return ok(job);
  }

  async findById(id: string) {
    return ok(this.jobs.find((job) => job.id === id));
  }

  async listRecent(limit: number) {
    return ok(this.jobs.slice(0, limit));
  }

  async markRunning(id: string, startedAt: string) {
    return ok({
      ...this.jobs.find((job) => job.id === id),
      status: 'running',
      startedAt,
    } as BackupJob);
  }

  async markSucceeded(id: string, completedAt: string) {
    return ok({
      ...this.jobs.find((job) => job.id === id),
      status: 'succeeded',
      completedAt,
    } as BackupJob);
  }

  async markFailed(input: { id: string; completedAt: string; failureCategory: string }) {
    return ok({
      ...this.jobs.find((job) => job.id === input.id),
      status: 'failed',
      completedAt: input.completedAt,
      failureCategory: input.failureCategory,
    } as BackupJob);
  }
}

class MemoryQueue implements BackupQueuePort {
  readonly jobIds: string[] = [];

  async enqueueBackupJob(job: BackupJob) {
    this.jobIds.push(job.id);
    return ok(undefined);
  }
}

describe('BackupQueueService', () => {
  it('should create a backup job and enqueue it for asynchronous execution', async () => {
    const queue = new MemoryQueue();
    const service = new BackupQueueService({
      backupEngine: new BackupEngineService({ jobs: new MemoryJobRepository() }),
      queue,
    });

    const result = await service.requestQueuedBackup({
      actorId: 'super-admin-1',
      scope: 'complete',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isOk()).toBe(true);
    expect(queue.jobIds).toEqual([result._unsafeUnwrap().id]);
  });

  it('should return a queue error when asynchronous enqueue fails', async () => {
    const queue: BackupQueuePort = {
      enqueueBackupJob: async () => err(new AppError(BACKUP_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED)),
    };
    const service = new BackupQueueService({
      backupEngine: new BackupEngineService({ jobs: new MemoryJobRepository() }),
      queue,
    });

    const result = await service.requestQueuedBackup({
      actorId: 'super-admin-1',
      scope: 'database',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED);
  });
});
