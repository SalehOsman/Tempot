import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';

const execFileAsync = promisify(execFile);

export interface BackupCommandRunner {
  run(
    command: string,
    args: readonly string[],
    options?: BackupCommandRunnerOptions,
  ): AsyncResult<void>;
}

export interface BackupCommandRunnerOptions {
  readonly cwd?: string;
}

export class NodeBackupCommandRunner implements BackupCommandRunner {
  async run(
    command: string,
    args: readonly string[],
    options?: BackupCommandRunnerOptions,
  ): AsyncResult<void> {
    try {
      await execFileAsync(command, [...args], { cwd: options?.cwd, windowsHide: true });
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.BACKUP_EXECUTION_FAILED, error));
    }
  }
}
