import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  BackupEncryptionService,
  BACKUP_ENGINE_ERRORS,
  RestoreExecutionService,
  type BackupArtifact,
  type BackupArtifactRepositoryPort,
  type RestoreRehearsal,
  type RestoreRehearsalRepositoryPort,
} from '../../src/index.js';

class MemoryArtifactRepository implements BackupArtifactRepositoryPort {
  constructor(private readonly artifact: BackupArtifact) {}

  async create(artifact: BackupArtifact) {
    return ok(artifact);
  }

  async findByBackupJobId() {
    return ok([this.artifact]);
  }
}

class MemoryRehearsalRepository implements RestoreRehearsalRepositoryPort {
  readonly rehearsals: RestoreRehearsal[] = [];

  async create(rehearsal: RestoreRehearsal) {
    this.rehearsals.push(rehearsal);
    return ok(rehearsal);
  }
}

describe('RestoreExecutionService', () => {
  it('should restore an encrypted backup into isolated database and file targets', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-restore-'));
    const storageReference = join(outputDirectory, 'backup-1.backup.enc');
    const encrypted = new BackupEncryptionService().encrypt(
      JSON.stringify({
        backupJobId: 'backup-1',
        contentType: 'application/vnd.tempot.backup+json',
        createdAt: '2026-07-27T00:00:00.000Z',
        databaseDump: Buffer.from('dump-content').toString('base64'),
        files: [{ path: 'nested/file.txt', data: Buffer.from('file-content').toString('base64') }],
      }),
      'test-encryption-key',
    );
    if (encrypted.isErr()) throw encrypted.error;
    await writeFile(storageReference, encrypted.value);
    const artifact = {
      id: 'artifact-1',
      artifactType: 'evidence',
      backupJobId: 'backup-1',
      checksum: 'sha256:abc',
      encrypted: true,
      sizeBytes: 100,
      storageProvider: 'local',
      storageReference,
    } satisfies BackupArtifact;
    const rehearsals = new MemoryRehearsalRepository();
    const runner = { run: vi.fn(async () => ok(undefined)) };
    const service = new RestoreExecutionService({
      artifacts: new MemoryArtifactRepository(artifact),
      rehearsals,
      runner,
    });

    const result = await service.runRestoreRehearsal(
      { backupJobId: 'backup-1', confirmedBy: 'admin-1' },
      {
        encryptionKey: 'test-encryption-key',
        liveDatabaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
        restoreDatabaseUrl: 'postgresql://tempot:secret@restore-postgres:5432/tempot_restore_db',
        restoredFilesPath: outputDirectory,
        targetClassification: 'isolated-restore',
      },
    );

    expect(result.isOk()).toBe(true);
    expect(runner.run).toHaveBeenCalledWith(
      'pg_restore',
      expect.arrayContaining([
        '--clean',
        '--if-exists',
        '--no-owner',
        '--dbname=postgresql://tempot:secret@restore-postgres:5432/tempot_restore_db',
      ]),
    );
    expect(rehearsals.rehearsals[0]).toMatchObject({ status: 'passed' });
    await expect(
      readFile(join(outputDirectory, 'backup-1', 'nested', 'file.txt'), 'utf8'),
    ).resolves.toBe('file-content');
  });

  it('should return a failure when isolated database restore fails', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-restore-'));
    const artifact = await createEncryptedArtifact(outputDirectory);
    const rehearsals = new MemoryRehearsalRepository();
    const runner = {
      run: vi.fn(async () => err(new AppError(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_FAILED))),
    };
    const service = new RestoreExecutionService({
      artifacts: new MemoryArtifactRepository(artifact),
      rehearsals,
      runner,
    });

    const result = await service.runRestoreRehearsal(
      { backupJobId: 'backup-1', confirmedBy: 'admin-1' },
      {
        encryptionKey: 'test-encryption-key',
        liveDatabaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
        restoreDatabaseUrl: 'postgresql://tempot:secret@restore-postgres:5432/tempot_restore_db',
        restoredFilesPath: outputDirectory,
        targetClassification: 'isolated-restore',
      },
    );

    expect(result.isErr()).toBe(true);
    expect(rehearsals.rehearsals[0]).toMatchObject({ status: 'failed' });
  });
});

async function createEncryptedArtifact(outputDirectory: string): Promise<BackupArtifact> {
  const storageReference = join(outputDirectory, 'backup-1.backup.enc');
  const encrypted = new BackupEncryptionService().encrypt(
    JSON.stringify({
      backupJobId: 'backup-1',
      contentType: 'application/vnd.tempot.backup+json',
      createdAt: '2026-07-27T00:00:00.000Z',
      databaseDump: Buffer.from('dump-content').toString('base64'),
      files: [],
    }),
    'test-encryption-key',
  );
  if (encrypted.isErr()) throw encrypted.error;
  await writeFile(storageReference, encrypted.value);
  return {
    id: 'artifact-1',
    artifactType: 'evidence',
    backupJobId: 'backup-1',
    checksum: 'sha256:abc',
    encrypted: true,
    sizeBytes: 100,
    storageProvider: 'local',
    storageReference,
  };
}
