import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type {
  BackupEngineServiceDeps,
  BackupJob,
  BackupListQuery,
  BackupListResult,
  BackupRequestCommand,
} from './backup-engine.types.js';

export class BackupEngineService {
  constructor(private readonly deps: BackupEngineServiceDeps) {}

  async requestBackup(command: BackupRequestCommand): AsyncResult<BackupJob> {
    const validation = this.validateCommand(command);
    if (validation.isErr()) return err(validation.error);

    const activeJob = await this.deps.jobs.findActiveJob();
    if (activeJob.isErr()) return err(activeJob.error);
    if (activeJob.value) {
      const stale = await this.failStaleActiveJob(activeJob.value);
      if (stale.isErr()) return err(stale.error);
      if (stale.value) return this.createBackupJob(command);
      return err(new AppError(BACKUP_ENGINE_ERRORS.ACTIVE_JOB_EXISTS));
    }

    return this.createBackupJob(command);
  }

  private createBackupJob(command: BackupRequestCommand): AsyncResult<BackupJob> {
    return this.deps.jobs.create({
      id: crypto.randomUUID(),
      requestedBy: command.actorId.trim(),
      scope: command.scope,
      status: 'pending',
      sourceEnvironment: command.sourceEnvironment.trim(),
      requestedAt: new Date().toISOString(),
    });
  }

  private async failStaleActiveJob(job: BackupJob): AsyncResult<boolean> {
    if (!this.isStaleActiveJob(job)) return ok(false);
    const completedAt = this.now().toISOString();
    const failed = await this.deps.jobs.markFailed({
      id: job.id,
      completedAt,
      failureCategory: BACKUP_ENGINE_ERRORS.ACTIVE_JOB_EXISTS,
      safeFailureMessage: 'stale_active_job_recovered',
    });
    if (failed.isErr()) return err(failed.error);
    return ok(true);
  }

  private isStaleActiveJob(job: BackupJob): boolean {
    const staleAfterMs = this.deps.activeJobStaleAfterMs;
    if (!staleAfterMs || staleAfterMs <= 0) return false;
    const startedAt = job.startedAt ?? job.requestedAt;
    return this.now().getTime() - new Date(startedAt).getTime() > staleAfterMs;
  }

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }

  async getBackup(id: string): AsyncResult<BackupJob> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB));
    }

    const job = await this.deps.jobs.findById(trimmedId);
    if (job.isErr()) return err(job.error);
    if (!job.value) return err(new AppError(BACKUP_ENGINE_ERRORS.BACKUP_NOT_FOUND));

    return ok(job.value);
  }

  async listBackups(query: BackupListQuery): AsyncResult<BackupListResult> {
    if (!Number.isInteger(query.limit) || query.limit <= 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_LIST_LIMIT));
    }

    const jobs = await this.deps.jobs.listRecent(query.limit);
    if (jobs.isErr()) return err(jobs.error);

    return ok({ jobs: jobs.value, limit: query.limit });
  }

  private validateCommand(command: BackupRequestCommand) {
    if (command.actorId.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_ACTOR));
    }
    if (command.sourceEnvironment.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_SOURCE_ENVIRONMENT));
    }
    return ok(undefined);
  }
}
