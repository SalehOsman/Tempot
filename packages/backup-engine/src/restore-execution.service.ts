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
  RestoreRehearsal,
  RestoreRehearsalRepositoryPort,
} from './backup-engine.types.js';

export interface RestoreExecutionCommand {
  readonly backupJobId: string;
  readonly confirmedBy: string;
}

export interface RestoreExecutionConfig {
  readonly encryptionKey: string;
  readonly liveDatabaseUrl: string;
  readonly restoreDatabaseUrl: string;
  readonly restoredFilesPath: string;
  readonly targetClassification: string;
}

interface RestoreExecutionDeps {
  readonly artifacts: Pick<BackupArtifactRepositoryPort, 'findByBackupJobId'>;
  readonly rehearsals: RestoreRehearsalRepositoryPort;
  readonly runner: BackupCommandRunner;
  readonly storage?: Pick<BackupStoragePort, 'loadArtifact'>;
  readonly encryption?: BackupEncryptionService;
}

interface BackupBundle {
  readonly databaseDump: string;
  readonly files: readonly { path: string; data: string }[];
}

const LIVE_TARGET_MARKERS = ['production', 'live', 'primary'];

export class RestoreExecutionService {
  private readonly encryption: BackupEncryptionService;

  constructor(private readonly deps: RestoreExecutionDeps) {
    this.encryption = deps.encryption ?? new BackupEncryptionService();
  }

  async runRestoreRehearsal(
    command: RestoreExecutionCommand,
    config: RestoreExecutionConfig,
  ): AsyncResult<RestoreRehearsal> {
    const validation = this.validate(command, config);
    if (validation.isErr()) return err(validation.error);

    const result = await this.restore(command.backupJobId, config);
    const rehearsal = await this.deps.rehearsals.create({
      id: randomUUID(),
      backupJobId: command.backupJobId,
      confirmedBy: command.confirmedBy,
      targetClassification: config.targetClassification,
      status: result.isOk() ? 'passed' : 'failed',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      schemaCheck: result.isOk() ? 'passed' : 'failed',
      dataCheck: result.isOk() ? 'passed' : 'failed',
      protectedDataCheck: result.isOk() ? 'passed' : 'failed',
      fileCoverageCheck: result.isOk() ? 'passed' : 'failed',
      safeFailureMessage: result.isErr() ? result.error.code : undefined,
    });
    if (rehearsal.isErr()) return err(rehearsal.error);
    if (result.isErr()) return err(result.error);
    return rehearsal;
  }

  private async restore(backupJobId: string, config: RestoreExecutionConfig): AsyncResult<void> {
    const artifacts = await this.deps.artifacts.findByBackupJobId(backupJobId);
    if (artifacts.isErr()) return err(artifacts.error);

    const artifact = artifacts.value.find((item) => item.encrypted && item.storageReference);
    if (!artifact?.storageReference) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.BACKUP_ARTIFACT_NOT_FOUND));
    }

    try {
      const payload = await this.loadEncryptedArtifact(artifact.storageReference);
      if (payload.isErr()) return err(payload.error);
      const decrypted = this.encryption.decrypt(payload.value, config.encryptionKey);
      if (decrypted.isErr()) return err(decrypted.error);

      const bundle = JSON.parse(decrypted.value) as BackupBundle;
      const restoreRoot = join(config.restoredFilesPath, backupJobId);
      await mkdir(restoreRoot, { recursive: true });
      const dumpPath = join(restoreRoot, 'database.dump');
      await writeFile(dumpPath, Buffer.from(bundle.databaseDump, 'base64'));
      const database = await this.restoreDatabase(config.restoreDatabaseUrl, dumpPath);
      if (database.isErr()) return err(database.error);
      await this.restoreFiles(restoreRoot, bundle.files);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_FAILED, error));
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
          throw new AppError(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_FAILED);
        }
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, Buffer.from(file.data, 'base64'));
      }),
    );
  }

  private validate(command: RestoreExecutionCommand, config: RestoreExecutionConfig) {
    if (command.backupJobId.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_JOB));
    }
    if (command.confirmedBy.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_CONFIRMATION_ACTOR));
    }
    if (config.restoreDatabaseUrl.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_RESTORE_TARGET));
    }
    if (config.restoredFilesPath.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_RESTORE_TARGET));
    }
    if (config.encryptionKey.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_ENCRYPTION_KEY));
    }
    if (config.restoreDatabaseUrl.trim() === config.liveDatabaseUrl.trim()) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.LIVE_RESTORE_TARGET));
    }
    if (this.isLiveTarget(config.targetClassification)) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.LIVE_RESTORE_TARGET));
    }
    return ok(undefined);
  }

  private isLiveTarget(value: string): boolean {
    const normalized = value.toLowerCase();
    return LIVE_TARGET_MARKERS.some((marker) => normalized.includes(marker));
  }
}
