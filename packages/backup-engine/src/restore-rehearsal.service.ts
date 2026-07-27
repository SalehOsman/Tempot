import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type {
  RestoreRehearsal,
  RestoreRehearsalCommand,
  RestoreRehearsalServiceDeps,
} from './backup-engine.types.js';

const LIVE_TARGET_MARKERS = ['production', 'live', 'primary'];

export class RestoreRehearsalService {
  constructor(private readonly deps: RestoreRehearsalServiceDeps) {}

  async requestRestoreRehearsal(command: RestoreRehearsalCommand): AsyncResult<RestoreRehearsal> {
    const validation = this.validateCommand(command);
    if (validation.isErr()) return err(validation.error);

    return this.deps.rehearsals.create({
      id: crypto.randomUUID(),
      backupJobId: command.backupJobId.trim(),
      confirmedBy: command.confirmedBy.trim(),
      targetClassification: command.targetClassification.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      schemaCheck: 'pending',
      dataCheck: 'pending',
      protectedDataCheck: 'pending',
      fileCoverageCheck: 'pending',
    });
  }

  private validateCommand(command: RestoreRehearsalCommand) {
    if (command.backupJobId.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB));
    }
    if (command.confirmedBy.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_CONFIRMATION_ACTOR));
    }
    if (command.targetClassification.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_RESTORE_TARGET));
    }
    if (this.isLiveTarget(command.targetClassification)) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.LIVE_RESTORE_TARGET));
    }
    return ok(undefined);
  }

  private isLiveTarget(targetClassification: string): boolean {
    const normalized = targetClassification.toLowerCase();
    return LIVE_TARGET_MARKERS.some((marker) => normalized.includes(marker));
  }
}
