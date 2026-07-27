import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma, type DatabaseClient, type IAuditLogger } from '@tempot/database';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type {
  BackupJob,
  BackupJobFailureUpdate,
  BackupJobStatus,
  BackupScope,
} from './backup-engine.types.js';

interface BackupJobModelDelegate {
  findMany(args: Record<string, unknown>): Promise<unknown[]>;
  findUnique(args: Record<string, unknown>): Promise<unknown | null>;
  create(args: Record<string, unknown>): Promise<unknown>;
  update(args: Record<string, unknown>): Promise<unknown>;
}

interface BackupJobRecord {
  id: string;
  requestedBy: string;
  scope: BackupScope;
  status: BackupJobStatus;
  sourceEnvironment: string;
  requestedAt: Date | string;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  failureCategory?: string | null;
  safeFailureMessage?: string | null;
}

export class BackupJobRepository {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly db: DatabaseClient = prisma,
  ) {}

  async findActiveJob(): AsyncResult<BackupJob | undefined> {
    try {
      const jobs = await this.model.findMany({
        where: { isDeleted: false, status: { in: ['pending', 'running'] } },
        take: 1,
        orderBy: { requestedAt: 'asc' },
      });
      return ok(this.toBackupJob(jobs[0]));
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async create(job: BackupJob): AsyncResult<BackupJob> {
    try {
      const created = this.requireBackupJob(await this.model.create({ data: job }));
      await this.auditLogger.log({
        action: 'backup-engine.backup-job.create',
        module: 'backup-engine',
        targetId: created.id,
        status: 'SUCCESS',
      });
      return ok(created);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async findById(id: string): AsyncResult<BackupJob | undefined> {
    try {
      const job = await this.model.findUnique({ where: { id } });
      return ok(this.toBackupJob(job));
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async listRecent(limit: number): AsyncResult<readonly BackupJob[]> {
    try {
      const jobs = await this.model.findMany({
        where: { isDeleted: false },
        take: limit,
        orderBy: { requestedAt: 'desc' },
      });
      return ok(jobs.map((job) => this.requireBackupJob(job)));
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  async markRunning(id: string, startedAt: string): AsyncResult<BackupJob> {
    return this.updateJob(id, { status: 'running', startedAt: new Date(startedAt) });
  }

  async markSucceeded(id: string, completedAt: string): AsyncResult<BackupJob> {
    return this.updateJob(id, { status: 'succeeded', completedAt: new Date(completedAt) });
  }

  async markFailed(input: BackupJobFailureUpdate): AsyncResult<BackupJob> {
    return this.updateJob(input.id, {
      status: 'failed',
      completedAt: new Date(input.completedAt),
      failureCategory: input.failureCategory,
      safeFailureMessage: input.safeFailureMessage,
    });
  }

  private async updateJob(id: string, data: Record<string, unknown>): AsyncResult<BackupJob> {
    try {
      const updated = this.requireBackupJob(await this.model.update({ where: { id }, data }));
      await this.auditLogger.log({
        action: 'backup-engine.backup-job.update',
        module: 'backup-engine',
        targetId: updated.id,
        status: 'SUCCESS',
      });
      return ok(updated);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB, error));
    }
  }

  private get model(): BackupJobModelDelegate {
    return (this.db as unknown as { backupJob: BackupJobModelDelegate }).backupJob;
  }

  private toBackupJob(value: unknown): BackupJob | undefined {
    if (!value) return undefined;
    if (this.isDeleted(value)) return undefined;
    return this.requireBackupJob(value);
  }

  private requireBackupJob(value: unknown): BackupJob {
    const record = value as BackupJobRecord;
    return {
      id: record.id,
      requestedBy: record.requestedBy,
      scope: record.scope,
      status: record.status,
      sourceEnvironment: record.sourceEnvironment,
      requestedAt: toIsoString(record.requestedAt),
      startedAt: toOptionalIsoString(record.startedAt),
      completedAt: toOptionalIsoString(record.completedAt),
      failureCategory: record.failureCategory ?? undefined,
      safeFailureMessage: record.safeFailureMessage ?? undefined,
    };
  }

  private isDeleted(value: unknown): boolean {
    return Boolean((value as { isDeleted?: boolean }).isDeleted);
  }
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toOptionalIsoString(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return toIsoString(value);
}
