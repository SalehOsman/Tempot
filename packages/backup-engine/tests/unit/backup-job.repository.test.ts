import { describe, expect, it, vi } from 'vitest';
import { BackupJobRepository } from '../../src/index.js';

const backupJob = {
  id: 'backup-1',
  requestedBy: 'super-admin-1',
  scope: 'complete',
  status: 'pending',
  sourceEnvironment: 'local-staging',
  requestedAt: '2026-07-27T00:00:00.000Z',
};

function createRepository() {
  const model = {
    findMany: vi.fn<[(args: Record<string, unknown>) => Promise<unknown[]>]>(),
    findUnique: vi.fn<[(args: Record<string, unknown>) => Promise<unknown>]>(),
    create: vi.fn<[(args: Record<string, unknown>) => Promise<unknown>]>(),
  };
  const db = { backupJob: model };
  const auditLogger = { log: vi.fn<(data: Record<string, unknown>) => Promise<void>>() };

  return {
    auditLogger,
    model,
    repository: new BackupJobRepository(auditLogger, db),
  };
}

describe('BackupJobRepository', () => {
  it('should find one active backup job using pending or running statuses only', async () => {
    const { model, repository } = createRepository();
    model.findMany.mockResolvedValue([backupJob]);

    const result = await repository.findActiveJob();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(backupJob);
    expect(model.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false, status: { in: ['pending', 'running'] } },
      take: 1,
      orderBy: { requestedAt: 'asc' },
    });
  });

  it('should return undefined when a backup job identifier is not found', async () => {
    const { model, repository } = createRepository();
    model.findUnique.mockResolvedValue(null);

    const result = await repository.findById('missing-backup');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeUndefined();
    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: 'missing-backup' } });
  });

  it('should hide soft-deleted backup jobs after lookup by identifier', async () => {
    const { repository, model } = createRepository();
    model.findUnique.mockResolvedValue({ ...backupJob, isDeleted: true });

    const result = await repository.findById('backup-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeUndefined();
  });

  it('should list recent backup jobs using the caller-provided limit', async () => {
    const { model, repository } = createRepository();
    model.findMany.mockResolvedValue([backupJob]);

    const result = await repository.listRecent(10);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([backupJob]);
    expect(model.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
      take: 10,
      orderBy: { requestedAt: 'desc' },
    });
  });

  it('should normalize database Date fields to ISO strings when listing recent jobs', async () => {
    const { model, repository } = createRepository();
    model.findMany.mockResolvedValue([
      {
        ...backupJob,
        completedAt: new Date('2026-07-27T00:10:00.000Z'),
        requestedAt: new Date('2026-07-27T00:00:00.000Z'),
        startedAt: new Date('2026-07-27T00:05:00.000Z'),
      },
    ]);

    const result = await repository.listRecent(10);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()[0]).toMatchObject({
      completedAt: '2026-07-27T00:10:00.000Z',
      requestedAt: '2026-07-27T00:00:00.000Z',
      startedAt: '2026-07-27T00:05:00.000Z',
    });
  });

  it('should create backup job metadata and write an audit entry', async () => {
    const { auditLogger, model, repository } = createRepository();
    model.create.mockResolvedValue(backupJob);

    const result = await repository.create(backupJob);

    expect(result.isOk()).toBe(true);
    expect(model.create).toHaveBeenCalledWith({ data: backupJob });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'backup-engine.backup-job.create',
        module: 'backup-engine',
        targetId: 'backup-1',
        status: 'SUCCESS',
      }),
    );
  });
});
