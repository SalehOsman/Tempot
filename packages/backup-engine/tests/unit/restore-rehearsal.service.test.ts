import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  BACKUP_ENGINE_ERRORS,
  RestoreRehearsalService,
  type RestoreRehearsal,
  type RestoreRehearsalRepositoryPort,
} from '../../src/index.js';

class MemoryRestoreRepository implements RestoreRehearsalRepositoryPort {
  readonly rehearsals: RestoreRehearsal[] = [];

  async create(rehearsal: RestoreRehearsal) {
    this.rehearsals.push(rehearsal);
    return ok(rehearsal);
  }
}

describe('RestoreRehearsalService', () => {
  it('should create a pending rehearsal for an isolated target', async () => {
    const repository = new MemoryRestoreRepository();
    const service = new RestoreRehearsalService({ rehearsals: repository });

    const result = await service.requestRestoreRehearsal({
      backupJobId: 'backup-1',
      confirmedBy: 'super-admin-1',
      targetClassification: 'isolated-postgres-restore',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.rehearsals[0]).toMatchObject({
      backupJobId: 'backup-1',
      confirmedBy: 'super-admin-1',
      targetClassification: 'isolated-postgres-restore',
      status: 'pending',
    });
  });

  it('should block restore rehearsal when target classification is live', async () => {
    const service = new RestoreRehearsalService({
      rehearsals: new MemoryRestoreRepository(),
    });

    const result = await service.requestRestoreRehearsal({
      backupJobId: 'backup-1',
      confirmedBy: 'super-admin-1',
      targetClassification: 'production-live-database',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.LIVE_RESTORE_TARGET);
  });

  it('should reject blank backup identifiers', async () => {
    const service = new RestoreRehearsalService({
      rehearsals: new MemoryRestoreRepository(),
    });

    const result = await service.requestRestoreRehearsal({
      backupJobId: ' ',
      confirmedBy: 'super-admin-1',
      targetClassification: 'isolated-postgres-restore',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB);
  });
});
