import { describe, expect, it, vi } from 'vitest';
import { RestoreRehearsalRepository, type RestoreRehearsal } from '../../src/index.js';

const rehearsal = {
  id: 'restore-1',
  backupJobId: 'backup-1',
  confirmedBy: 'super-admin-1',
  targetClassification: 'isolated-staging',
  status: 'pending',
  requestedAt: '2026-07-27T00:00:00.000Z',
  schemaCheck: 'pending',
  dataCheck: 'pending',
  protectedDataCheck: 'pending',
  fileCoverageCheck: 'pending',
} satisfies RestoreRehearsal;

function createRepository() {
  const model = {
    create: vi.fn<[(args: Record<string, unknown>) => Promise<unknown>]>(),
    findFirst: vi.fn<[(args: Record<string, unknown>) => Promise<unknown>]>(),
  };
  const db = { restoreRehearsal: model };
  const auditLogger = { log: vi.fn<(data: Record<string, unknown>) => Promise<void>>() };

  return {
    auditLogger,
    model,
    repository: new RestoreRehearsalRepository(auditLogger, db),
  };
}

describe('RestoreRehearsalRepository', () => {
  it('should persist restore rehearsal metadata and audit the write', async () => {
    const { auditLogger, model, repository } = createRepository();
    model.create.mockResolvedValue(rehearsal);

    const result = await repository.create(rehearsal);

    expect(result.isOk()).toBe(true);
    expect(model.create).toHaveBeenCalledWith({ data: rehearsal });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'backup-engine.restore-rehearsal.create',
        module: 'backup-engine',
        targetId: 'restore-1',
        status: 'SUCCESS',
      }),
    );
  });

  it('should find the latest passed rehearsal for a backup job', async () => {
    const { model, repository } = createRepository();
    model.findFirst.mockResolvedValue(rehearsal);

    const result = await repository.findLatestPassedByBackupJobId('backup-1');

    expect(result.isOk()).toBe(true);
    expect(model.findFirst).toHaveBeenCalledWith({
      where: { backupJobId: 'backup-1', status: 'passed', isDeleted: false },
      orderBy: { requestedAt: 'desc' },
    });
  });
});
