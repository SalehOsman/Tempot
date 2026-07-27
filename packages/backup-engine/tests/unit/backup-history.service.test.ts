import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  BACKUP_ENGINE_ERRORS,
  BackupEngineService,
  type BackupJob,
  type BackupJobRepositoryPort,
} from '../../src/index.js';

const completedJob: BackupJob = {
  id: 'backup-complete',
  requestedBy: 'super-admin-1',
  scope: 'complete',
  status: 'succeeded',
  sourceEnvironment: 'local-staging',
  requestedAt: '2026-07-27T00:00:00.000Z',
  completedAt: '2026-07-27T00:01:00.000Z',
};

class HistoryRepository implements BackupJobRepositoryPort {
  constructor(private readonly jobs: readonly BackupJob[]) {}

  async findActiveJob() {
    return ok(undefined);
  }

  async create(job: BackupJob) {
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

describe('BackupEngineService history', () => {
  it('should return backup job details by identifier', async () => {
    const service = new BackupEngineService({
      jobs: new HistoryRepository([completedJob]),
    });

    const result = await service.getBackup('backup-complete');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({ id: 'backup-complete' });
  });

  it('should return a not found error for missing backup jobs', async () => {
    const service = new BackupEngineService({ jobs: new HistoryRepository([]) });

    const result = await service.getBackup('missing-backup');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.BACKUP_NOT_FOUND);
  });

  it('should list recent backups with a positive bounded limit', async () => {
    const service = new BackupEngineService({
      jobs: new HistoryRepository([completedJob, { ...completedJob, id: 'backup-2' }]),
    });

    const result = await service.listBackups({ limit: 1 });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().jobs).toEqual([completedJob]);
    expect(result._unsafeUnwrap().limit).toBe(1);
  });

  it('should reject non-positive backup history limits', async () => {
    const service = new BackupEngineService({ jobs: new HistoryRepository([]) });

    const result = await service.listBackups({ limit: 0 });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.INVALID_LIST_LIMIT);
  });
});
