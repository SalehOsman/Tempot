import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import { formatBackupArtifactName } from './backup-artifact-name.service.js';
import {
  BACKUP_CONTENT_TYPE,
  storeEncryptedBackupArtifact,
} from './backup-artifact-storage.service.js';
import { BackupEncryptionService } from './backup-encryption.service.js';
import type { BackupCommandRunner } from './backup-command.runner.js';
import type { BackupArtifactStoreReceipt, BackupStoragePort } from './backup-engine.ports.js';
import type {
  BackupArtifact,
  BackupArtifactRepositoryPort,
  BackupJob,
  BackupJobRepositoryPort,
} from './backup-engine.types.js';

export interface BackupExecutionConfig {
  readonly databaseUrl: string;
  readonly encryptionKey: string;
  readonly outputDirectory: string;
  readonly filenameTimeZone?: string;
  readonly managedFilesPath?: string;
}

interface BackupExecutionDeps {
  readonly artifacts: BackupArtifactRepositoryPort;
  readonly jobs: Pick<BackupJobRepositoryPort, 'markRunning' | 'markSucceeded' | 'markFailed'>;
  readonly runner: BackupCommandRunner;
  readonly storage?: BackupStoragePort;
  readonly encryption?: BackupEncryptionService;
}

interface BackupBundleFile {
  readonly path: string;
  readonly data: string;
}

interface BackupBundle {
  readonly contentType: string;
  readonly backupJobId: string;
  readonly databaseDump: string;
  readonly files: readonly BackupBundleFile[];
  readonly createdAt: string;
}

export class BackupExecutionService {
  private readonly encryption: BackupEncryptionService;

  constructor(private readonly deps: BackupExecutionDeps) {
    this.encryption = deps.encryption ?? new BackupEncryptionService();
  }

  async executeBackup(job: BackupJob, config: BackupExecutionConfig): AsyncResult<BackupArtifact> {
    const validation = this.validateConfig(config);
    if (validation.isErr()) return err(validation.error);

    const startedAt = new Date().toISOString();
    const running = await this.deps.jobs.markRunning(job.id, startedAt);
    if (running.isErr()) return err(running.error);

    const result = await this.createEncryptedArtifact(job, config, startedAt);
    if (result.isErr()) {
      await this.deps.jobs.markFailed({
        id: job.id,
        completedAt: new Date().toISOString(),
        failureCategory: result.error.code,
      });
      return err(result.error);
    }

    const completed = await this.deps.jobs.markSucceeded(job.id, new Date().toISOString());
    if (completed.isErr()) return err(completed.error);
    return result;
  }

  private async createEncryptedArtifact(
    job: BackupJob,
    config: BackupExecutionConfig,
    createdAt: string,
  ): AsyncResult<BackupArtifact> {
    let stagingDirectory: string | undefined;
    try {
      await mkdir(config.outputDirectory, { recursive: true });
      stagingDirectory = join(config.outputDirectory, 'staging', job.id);
      await mkdir(stagingDirectory, { recursive: true });
      const dumpPath = join(stagingDirectory, 'database.dump');
      const dumpResult = await this.dumpDatabase(config.databaseUrl, dumpPath);
      if (dumpResult.isErr()) return err(dumpResult.error);

      const bundle = await this.buildBundle({
        backupJobId: job.id,
        dumpPath,
        managedFilesPath: config.managedFilesPath,
        createdAt,
      });
      const encrypted = this.encryption.encrypt(JSON.stringify(bundle), config.encryptionKey);
      if (encrypted.isErr()) return err(encrypted.error);

      const storage = await storeEncryptedBackupArtifact({
        backupJobId: job.id,
        artifactName: formatBackupArtifactName({
          backupJobId: job.id,
          createdAt,
          timeZone: config.filenameTimeZone,
        }),
        artifactType: 'evidence',
        encryptedPayload: encrypted.value,
        outputDirectory: config.outputDirectory,
        storage: this.deps.storage,
      });
      if (storage.isErr()) return err(storage.error);
      return this.persistArtifact(job.id, storage.value);
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.BACKUP_EXECUTION_FAILED, error));
    } finally {
      await this.removeStagingDirectory(stagingDirectory);
    }
  }

  private async dumpDatabase(databaseUrl: string, dumpPath: string): AsyncResult<void> {
    return this.deps.runner.run('pg_dump', [
      '--format=custom',
      '--no-owner',
      `--file=${dumpPath}`,
      databaseUrl,
    ]);
  }

  private async buildBundle(input: {
    backupJobId: string;
    dumpPath: string;
    managedFilesPath: string | undefined;
    createdAt: string;
  }): Promise<BackupBundle> {
    return {
      contentType: BACKUP_CONTENT_TYPE,
      backupJobId: input.backupJobId,
      databaseDump: (await readFile(input.dumpPath)).toString('base64'),
      files: input.managedFilesPath ? await this.collectFiles(input.managedFilesPath) : [],
      createdAt: input.createdAt,
    };
  }

  private async collectFiles(rootPath: string): Promise<BackupBundleFile[]> {
    if (!(await this.pathExists(rootPath))) return [];
    const files = await this.collectFilePaths(rootPath);
    return Promise.all(
      files.map(async (filePath) => ({
        path: relative(rootPath, filePath).replaceAll('\\', '/'),
        data: (await readFile(filePath)).toString('base64'),
      })),
    );
  }

  private async collectFilePaths(rootPath: string): Promise<string[]> {
    const entries = await readdir(rootPath, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(rootPath, entry.name);
        if (entry.isDirectory()) return this.collectFilePaths(fullPath);
        return [fullPath];
      }),
    );
    return nested.flat();
  }

  private async persistArtifact(
    backupJobId: string,
    receipt: BackupArtifactStoreReceipt,
  ): AsyncResult<BackupArtifact> {
    return this.deps.artifacts.create({
      id: randomUUID(),
      backupJobId,
      artifactType: 'evidence',
      checksum: receipt.checksum,
      encrypted: true,
      sizeBytes: receipt.sizeBytes,
      storageReference: receipt.storageReference,
      storageProvider: 'local',
    });
  }

  private validateConfig(config: BackupExecutionConfig) {
    if (config.databaseUrl.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_DATABASE_URL));
    }
    if (config.outputDirectory.trim().length === 0 || basename(config.outputDirectory) === '') {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_BACKUP_OUTPUT));
    }
    if (config.encryptionKey.trim().length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_ENCRYPTION_KEY));
    }
    return ok(undefined);
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch (error: unknown) {
      void error;
      return false;
    }
  }

  private async removeStagingDirectory(stagingDirectory: string | undefined): Promise<void> {
    if (!stagingDirectory) return;
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}
