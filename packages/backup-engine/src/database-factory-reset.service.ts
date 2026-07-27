import { randomUUID } from 'node:crypto';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type { BackupCommandRunner } from './backup-command.runner.js';
import type { DatabaseFactoryResetResult } from './backup-engine.types.js';

export interface DatabaseFactoryResetCommand {
  readonly confirmedBy: string;
  readonly databaseUrl: string;
  readonly preResetBackupJobId: string;
  readonly prismaCliPath: string;
  readonly prismaSchemaPath: string;
  readonly prismaWorkingDirectory: string;
}

interface DatabaseFactoryResetDeps {
  readonly runner: BackupCommandRunner;
}

const RESET_SQL =
  'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;';

export class DatabaseFactoryResetService {
  constructor(private readonly deps: DatabaseFactoryResetDeps) {}

  async resetDatabase(
    command: DatabaseFactoryResetCommand,
  ): AsyncResult<DatabaseFactoryResetResult> {
    const validation = this.validate(command);
    if (validation.isErr()) return err(validation.error);

    const requestedAt = new Date().toISOString();
    const reset = await this.deps.runner.run('psql', [
      `--dbname=${command.databaseUrl}`,
      `--command=${RESET_SQL}`,
    ]);
    if (reset.isErr()) return err(reset.error);

    const migrate = await this.deps.runner.run(
      command.prismaCliPath,
      ['migrate', 'deploy', `--schema=${command.prismaSchemaPath}`],
      { cwd: command.prismaWorkingDirectory },
    );
    if (migrate.isErr()) return err(migrate.error);

    return ok({
      id: randomUUID(),
      confirmedBy: command.confirmedBy,
      preResetBackupJobId: command.preResetBackupJobId,
      status: 'succeeded',
      requestedAt,
      completedAt: new Date().toISOString(),
    });
  }

  private validate(command: DatabaseFactoryResetCommand) {
    if (
      command.confirmedBy.trim().length === 0 ||
      command.databaseUrl.trim().length === 0 ||
      command.preResetBackupJobId.trim().length === 0 ||
      command.prismaCliPath.trim().length === 0 ||
      command.prismaSchemaPath.trim().length === 0 ||
      command.prismaWorkingDirectory.trim().length === 0
    ) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.DATABASE_FACTORY_RESET_FAILED));
    }
    return ok(undefined);
  }
}
