import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  BACKUP_ENGINE_ERRORS,
  BackupEngineService,
  type BackupJob,
  type BackupJobRepositoryPort,
} from '../../src/index.js';

class MemoryJobRepository implements BackupJobRepositoryPort {
  readonly jobs: BackupJob[] = [];

  constructor(private readonly activeJob: BackupJob | undefined = undefined) {}

  async findActiveJob() {
    return ok(this.activeJob);
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
      ...this.jobs.find((item) => item.id === id),
      status: 'succeeded',
      completedAt,
    } as BackupJob);
  }

  async markFailed(input: { id: string; completedAt: string; failureCategory: string }) {
    return ok({
      ...this.jobs.find((item) => item.id === input.id),
      status: 'failed',
      completedAt: input.completedAt,
      failureCategory: input.failureCategory,
    } as BackupJob);
  }
}

describe('BackupEngineService', () => {
  it('should create a pending complete backup job when no job is active', async () => {
    const repository = new MemoryJobRepository();
    const service = new BackupEngineService({ jobs: repository });

    const result = await service.requestBackup({
      actorId: 'super-admin-1',
      scope: 'complete',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.jobs[0]).toMatchObject({
      requestedBy: 'super-admin-1',
      scope: 'complete',
      sourceEnvironment: 'local-staging',
      status: 'pending',
    });
  });

  it('should reject backup requests with blank actor identifiers', async () => {
    const service = new BackupEngineService({ jobs: new MemoryJobRepository() });

    const result = await service.requestBackup({
      actorId: ' ',
      scope: 'database',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.INVALID_ACTOR);
  });

  it('should block a backup request when another job is active', async () => {
    const activeJob = {
      id: 'backup-active',
      requestedBy: 'super-admin-1',
      scope: 'complete',
      status: 'running',
      sourceEnvironment: 'local-staging',
      requestedAt: '2026-07-26T00:00:00.000Z',
    } satisfies BackupJob;
    const service = new BackupEngineService({
      jobs: new MemoryJobRepository(activeJob),
    });

    const result = await service.requestBackup({
      actorId: 'super-admin-2',
      scope: 'files',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.ACTIVE_JOB_EXISTS);
  });

  it('should fail stale active jobs before creating a new backup request', async () => {
    const activeJob = {
      id: 'backup-stale',
      requestedBy: 'super-admin-1',
      scope: 'complete',
      status: 'pending',
      sourceEnvironment: 'local-staging',
      requestedAt: '2026-07-26T00:00:00.000Z',
    } satisfies BackupJob;
    const repository = new MemoryJobRepository(activeJob);
    const service = new BackupEngineService({
      activeJobStaleAfterMs: 1,
      jobs: repository,
      now: () => new Date('2026-07-26T00:01:00.000Z'),
    });

    const result = await service.requestBackup({
      actorId: 'super-admin-2',
      scope: 'complete',
      sourceEnvironment: 'local-staging',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.jobs[0]).toMatchObject({
      requestedBy: 'super-admin-2',
      status: 'pending',
    });
  });
});
