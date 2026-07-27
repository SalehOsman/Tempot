import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma, type DatabaseClient, type IAuditLogger } from '@tempot/database';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type { RestoreRehearsal } from './backup-engine.types.js';

interface RestoreRehearsalModelDelegate {
  create(args: Record<string, unknown>): Promise<unknown>;
  findFirst(args: Record<string, unknown>): Promise<unknown>;
}

export class RestoreRehearsalRepository {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly db: DatabaseClient = prisma,
  ) {}

  async create(rehearsal: RestoreRehearsal): AsyncResult<RestoreRehearsal> {
    try {
      const created = this.requireRehearsal(await this.model.create({ data: rehearsal }));
      await this.auditLogger.log({
        action: 'backup-engine.restore-rehearsal.create',
        module: 'backup-engine',
        targetId: created.id,
        status: 'SUCCESS',
      });
      return ok(created);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async findLatestPassedByBackupJobId(
    backupJobId: string,
  ): AsyncResult<RestoreRehearsal | undefined> {
    try {
      const found = await this.model.findFirst({
        where: { backupJobId, status: 'passed', isDeleted: false },
        orderBy: { requestedAt: 'desc' },
      });
      return ok(found ? this.requireRehearsal(found) : undefined);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  private get model(): RestoreRehearsalModelDelegate {
    return (this.db as unknown as { restoreRehearsal: RestoreRehearsalModelDelegate })
      .restoreRehearsal;
  }

  private requireRehearsal(value: unknown): RestoreRehearsal {
    return value as RestoreRehearsal;
  }
}
