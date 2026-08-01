import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
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
  constructor(private readonly artifacts: BackupArtifact[]) {}

  async create(artifact: BackupArtifact) {
    return ok(artifact);
  }

  async findByBackupJobId() {
    return ok(this.artifacts);
  }
}

class MemoryRehearsalRepository implements RestoreRehearsalRepositoryPort {
  readonly rehearsals: RestoreRehearsal[] = [];

  async create(rehearsal: RestoreRehearsal) {
    this.rehearsals.push(rehearsal);
    return ok(rehearsal);
  }
}

describe('RestoreExecutionService validation', () => {
  it('should reject live restore targets before reading backup artifacts', async () => {
    const repository = new MemoryArtifactRepository([]);
    const service = new RestoreExecutionService({
      artifacts: repository,
      rehearsals: new MemoryRehearsalRepository(),
      runner: { run: vi.fn(async () => ok(undefined)) },
    });

    const result = await service.runRestoreRehearsal(
      { backupJobId: 'backup-1', confirmedBy: 'admin-1' },
      {
        encryptionKey: 'test-encryption-key',
        liveDatabaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
        restoreDatabaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
        restoredFilesPath: await mkdtemp(join(tmpdir(), 'tempot-restore-')),
        targetClassification: 'isolated-restore',
      },
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.code).toBe(BACKUP_ENGINE_ERRORS.LIVE_RESTORE_TARGET);
  });

  it('should fail the rehearsal when a stored file escapes the restore root', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-restore-'));
    const payload = JSON.stringify({
      databaseDump: Buffer.from('dump-content').toString('base64'),
      files: [{ path: '../outside.txt', data: Buffer.from('content').toString('base64') }],
    });
    const encrypted = new BackupEncryptionService().encrypt(payload, 'test-encryption-key');
    if (encrypted.isErr()) throw encrypted.error;
    const artifact = createArtifact('storage://backup-1');
    const rehearsals = new MemoryRehearsalRepository();
    const service = new RestoreExecutionService({
      artifacts: new MemoryArtifactRepository([artifact]),
      rehearsals,
      runner: { run: vi.fn(async () => ok(undefined)) },
      storage: { loadArtifact: vi.fn(async () => ok(Buffer.from(encrypted.value))) },
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
    if (result.isErr()) {
      expect(result.error.code).toBe(BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_FAILED);
    }
    expect(rehearsals.rehearsals[0]).toMatchObject({
      safeFailureMessage: BACKUP_ENGINE_ERRORS.RESTORE_REHEARSAL_FAILED,
      status: 'failed',
    });
  });
});

function createArtifact(storageReference: string): BackupArtifact {
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
