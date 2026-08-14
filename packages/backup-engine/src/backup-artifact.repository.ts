import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma, type DatabaseClient, type IAuditLogger } from '@tempot/database';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type { BackupArtifact } from './backup-engine.types.js';

interface BackupArtifactModelDelegate {
  create(args: Record<string, unknown>): Promise<unknown>;
  findMany(args: Record<string, unknown>): Promise<unknown[]>;
}

export class BackupArtifactRepository {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly db: DatabaseClient = prisma,
  ) {}

  async create(artifact: BackupArtifact): AsyncResult<BackupArtifact> {
    try {
      const created = this.requireArtifact(await this.model.create({ data: artifact }));
      await this.auditLogger.log({
        action: 'backup-engine.backup-artifact.create',
        module: 'backup-engine',
        targetId: created.id,
        status: 'SUCCESS',
      });
      return ok(created);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async findByBackupJobId(backupJobId: string): AsyncResult<readonly BackupArtifact[]> {
    try {
      const artifacts = await this.model.findMany({
        where: { backupJobId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      return ok(artifacts.map((artifact) => this.requireArtifact(artifact)));
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  private get model(): BackupArtifactModelDelegate {
    return (this.db as unknown as { backupArtifact: BackupArtifactModelDelegate }).backupArtifact;
  }

  private requireArtifact(value: unknown): BackupArtifact {
    return value as BackupArtifact;
  }
}
