import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import {
  BACKUP_ENGINE_ERRORS,
  BackupEncryptionService,
  ProductionRestoreExecutionService,
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
  constructor(private readonly latestPassed: RestoreRehearsal | undefined) {}

  async create(rehearsal: RestoreRehearsal) {
    return ok(rehearsal);
  }

  async findLatestPassedByBackupJobId() {
    return ok(this.latestPassed);
  }
}

describe('ProductionRestoreExecutionService', () => {
  it('should block production restore when no passed rehearsal exists', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-production-restore-'));
    const service = new ProductionRestoreExecutionService({
      artifacts: new MemoryArtifactRepository(await createEncryptedArtifact(outputDirectory)),
      rehearsals: new MemoryRehearsalRepository(undefined),
      runner: { run: vi.fn(async () => ok(undefined)) },
    });

    const result = await service.runProductionRestore(
      {
        backupJobId: 'backup-1',
        confirmedBy: 'admin-1',
        preRestoreBackupJobId: 'pre-restore-1',
      },
      createConfig(outputDirectory),
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_REQUIRED);
  });

  it('should restore a rehearsed backup into live database and file targets', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-production-restore-'));
    const liveFilesPath = join(outputDirectory, 'live-files');
    const runner = { run: vi.fn(async () => ok(undefined)) };
    const service = new ProductionRestoreExecutionService({
      artifacts: new MemoryArtifactRepository(await createEncryptedArtifact(outputDirectory)),
      rehearsals: new MemoryRehearsalRepository(createPassedRehearsal()),
      runner,
    });

    const result = await service.runProductionRestore(
      {
        backupJobId: 'backup-1',
        confirmedBy: 'admin-1',
        preRestoreBackupJobId: 'pre-restore-1',
      },
      { ...createConfig(outputDirectory), liveFilesPath },
    );

    expect(result.isOk()).toBe(true);
    expect(runner.run).toHaveBeenCalledWith(
      'pg_restore',
      expect.arrayContaining([
        '--clean',
        '--if-exists',
        '--no-owner',
        '--dbname=postgresql://tempot:secret@postgres:5432/tempot_db',
      ]),
    );
    expect(runner.run).toHaveBeenCalledWith(
      '/app/node_modules/.pnpm/node_modules/.bin/prisma',
      ['migrate', 'deploy', '--schema=/app/node_modules/@tempot/database/prisma/schema.prisma'],
      { cwd: '/app/node_modules/@tempot/database' },
    );
    expect(result._unsafeUnwrap()).toMatchObject({
      backupJobId: 'backup-1',
      preRestoreBackupJobId: 'pre-restore-1',
      status: 'succeeded',
    });
    await expect(readFile(join(liveFilesPath, 'nested', 'file.txt'), 'utf8')).resolves.toBe(
      'file-content',
    );
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
      files: [{ path: 'nested/file.txt', data: Buffer.from('file-content').toString('base64') }],
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

function createPassedRehearsal(): RestoreRehearsal {
  return {
    id: 'rehearsal-1',
    backupJobId: 'backup-1',
    confirmedBy: 'admin-1',
    targetClassification: 'isolated-restore',
    status: 'passed',
    requestedAt: '2026-07-27T00:00:00.000Z',
    schemaCheck: 'passed',
    dataCheck: 'passed',
    protectedDataCheck: 'passed',
    fileCoverageCheck: 'passed',
  };
}

function createConfig(workPath: string) {
  return {
    encryptionKey: 'test-encryption-key',
    liveDatabaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
    liveFilesPath: join(workPath, 'live-files'),
    prismaCliPath: '/app/node_modules/.pnpm/node_modules/.bin/prisma',
    prismaSchemaPath: '/app/node_modules/@tempot/database/prisma/schema.prisma',
    prismaWorkingDirectory: '/app/node_modules/@tempot/database',
    workPath,
  };
}
