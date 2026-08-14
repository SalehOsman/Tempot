import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import { BackupEncryptionService } from './backup-encryption.service.js';
import type { BackupCommandRunner } from './backup-command.runner.js';
import type { BackupStoragePort } from './backup-engine.ports.js';
import type {
  BackupArtifactRepositoryPort,
  ProductionRestoreResult,
  RestoreRehearsalRepositoryPort,
} from './backup-engine.types.js';

export interface ProductionRestoreCommand {
  readonly backupJobId: string;
  readonly confirmedBy: string;
  readonly preRestoreBackupJobId: string;
}

export interface ProductionRestoreConfig {
  readonly encryptionKey: string;
  readonly liveDatabaseUrl: string;
  readonly liveFilesPath?: string;
  readonly prismaCliPath: string;
  readonly prismaSchemaPath: string;
  readonly prismaWorkingDirectory: string;
  readonly workPath: string;
}

interface ProductionRestoreDeps {
  readonly artifacts: Pick<BackupArtifactRepositoryPort, 'findByBackupJobId'>;
  readonly rehearsals: Pick<RestoreRehearsalRepositoryPort, 'findLatestPassedByBackupJobId'>;
  readonly runner: BackupCommandRunner;
  readonly storage?: Pick<BackupStoragePort, 'loadArtifact'>;
  readonly encryption?: BackupEncryptionService;
}

interface BackupBundle {
  readonly databaseDump: string;
  readonly files: readonly { path: string; data: string }[];
}

export class ProductionRestoreExecutionService {
  private readonly encryption: BackupEncryptionService;

  constructor(private readonly deps: ProductionRestoreDeps) {
    this.encryption = deps.encryption ?? new BackupEncryptionService();
  }

  async runProductionRestore(
    command: ProductionRestoreCommand,
    config: ProductionRestoreConfig,
  ): AsyncResult<ProductionRestoreResult> {
    const validation = this.validate(command, config);
    if (validation.isErr()) return err(validation.error);

    const rehearsal = await this.deps.rehearsals.findLatestPassedByBackupJobId(command.backupJobId);
    if (rehearsal.isErr()) return err(rehearsal.error);
    if (!rehearsal.value) return err(new AppError(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_REQUIRED));

    const requestedAt = new Date().toISOString();
    const restored = await this.restore(command.backupJobId, config);
    if (restored.isErr()) return err(restored.error);
    return ok({
      id: randomUUID(),
      backupJobId: command.backupJobId,
      confirmedBy: command.confirmedBy,
      preRestoreBackupJobId: command.preRestoreBackupJobId,
      status: 'succeeded',
      requestedAt,
      completedAt: new Date().toISOString(),
    });
  }

  private async restore(backupJobId: string, config: ProductionRestoreConfig): AsyncResult<void> {
    try {
      const artifacts = await this.deps.artifacts.findByBackupJobId(backupJobId);
      if (artifacts.isErr()) return err(artifacts.error);
      const artifact = artifacts.value.find((item) => item.encrypted && item.storageReference);
      if (!artifact?.storageReference) {
        return err(new AppError(BACKUP_ENGINE_ERRORS.BACKUP_ARTIFACT_NOT_FOUND));
      }

      const payload = await this.loadEncryptedArtifact(artifact.storageReference);
      if (payload.isErr()) return err(payload.error);
      const decrypted = this.encryption.decrypt(payload.value, config.encryptionKey);
      if (decrypted.isErr()) return err(decrypted.error);

      const bundle = JSON.parse(decrypted.value) as BackupBundle;
      const workRoot = join(config.workPath, 'production', backupJobId);
      await mkdir(workRoot, { recursive: true });
      const dumpPath = join(workRoot, 'database.dump');
      await writeFile(dumpPath, Buffer.from(bundle.databaseDump, 'base64'));
      const database = await this.restoreDatabase(config.liveDatabaseUrl, dumpPath);
      if (database.isErr()) return err(database.error);
      const migrations = await this.deployMigrations(config);
      if (migrations.isErr()) return err(migrations.error);
      if (config.liveFilesPath) await this.restoreFiles(config.liveFilesPath, bundle.files);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.PRODUCTION_RESTORE_FAILED, error));
    }
  }

  private async restoreDatabase(databaseUrl: string, dumpPath: string): AsyncResult<void> {
    return this.deps.runner.run('pg_restore', [
      '--clean',
      '--if-exists',
      '--no-owner',
      `--dbname=${databaseUrl}`,
      dumpPath,
    ]);
  }

  private async deployMigrations(config: ProductionRestoreConfig): AsyncResult<void> {
    return this.deps.runner.run(
      config.prismaCliPath,
      ['migrate', 'deploy', `--schema=${config.prismaSchemaPath}`],
      { cwd: config.prismaWorkingDirectory },
    );
  }

  private async loadEncryptedArtifact(storageReference: string): AsyncResult<string> {
    if (this.deps.storage) {
      const artifact = await this.deps.storage.loadArtifact(storageReference);
      if (artifact.isErr()) return err(artifact.error);
      return ok(artifact.value.toString('utf8'));
    }
    return ok(await readFile(storageReference, 'utf8'));
  }

  private async restoreFiles(
    restoreRoot: string,
    files: readonly { path: string; data: string }[],
  ): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        const rootPath = resolve(restoreRoot);
        const targetPath = resolve(rootPath, file.path);
        const targetRelativePath = relative(rootPath, targetPath);
        if (
          targetRelativePath.length === 0 ||
          targetRelativePath.startsWith('..') ||
          isAbsolute(targetRelativePath)
        ) {
          throw new AppError(BACKUP_ENGINE_ERRORS.PRODUCTION_RESTORE_FAILED);
        }
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, Buffer.from(file.data, 'base64'));
      }),
    );
  }

  private validate(command: ProductionRestoreCommand, config: ProductionRestoreConfig) {
    if (command.backupJobId.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB));
    }
    if (command.confirmedBy.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_CONFIRMATION_ACTOR));
    }
    if (command.preRestoreBackupJobId.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB));
    }
    if (
      config.liveDatabaseUrl.trim().length === 0 ||
      config.prismaCliPath.trim().length === 0 ||
      config.prismaSchemaPath.trim().length === 0 ||
      config.prismaWorkingDirectory.trim().length === 0 ||
      config.workPath.trim().length === 0
    ) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_RESTORE_TARGET));
    }
    if (config.encryptionKey.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_ENCRYPTION_KEY));
    }
    return ok(undefined);
  }
}
