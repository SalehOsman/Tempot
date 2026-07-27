import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import {
  BackupExecutionService,
  type BackupArtifact,
  type BackupArtifactRepositoryPort,
  type BackupJob,
  type BackupJobRepositoryPort,
  type BackupStoragePort,
} from '../../src/index.js';

class MemoryJobRepository implements BackupJobRepositoryPort {
  readonly updates: string[] = [];

  async findActiveJob() {
    return ok(undefined);
  }

  async create(job: BackupJob) {
    return ok(job);
  }

  async findById() {
    return ok(undefined);
  }

  async listRecent() {
    return ok([]);
  }

  async markRunning(id: string, startedAt: string) {
    this.updates.push(`running:${id}:${startedAt}`);
    return ok({ ...job, status: 'running', startedAt } satisfies BackupJob);
  }

  async markSucceeded(id: string, completedAt: string) {
    this.updates.push(`succeeded:${id}:${completedAt}`);
    return ok({ ...job, status: 'succeeded', completedAt } satisfies BackupJob);
  }

  async markFailed(input: { id: string; completedAt: string; failureCategory: string }) {
    this.updates.push(`failed:${input.id}:${input.completedAt}:${input.failureCategory}`);
    return ok({
      ...job,
      status: 'failed',
      completedAt: input.completedAt,
      failureCategory: input.failureCategory,
    } satisfies BackupJob);
  }
}

class MemoryArtifactRepository implements BackupArtifactRepositoryPort {
  readonly artifacts: BackupArtifact[] = [];

  async create(artifact: BackupArtifact) {
    this.artifacts.push(artifact);
    return ok(artifact);
  }

  async findByBackupJobId() {
    return ok(this.artifacts);
  }
}

const job = {
  id: 'backup-1',
  requestedBy: 'admin-1',
  requestedAt: '2026-07-27T00:00:00.000Z',
  scope: 'complete',
  sourceEnvironment: 'test',
  status: 'pending',
} satisfies BackupJob;

describe('BackupExecutionService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create an encrypted backup artifact with manifest and database dump', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-backup-'));
    const managedFilesPath = await mkdtemp(join(tmpdir(), 'tempot-files-'));
    await writeFile(join(managedFilesPath, 'note.txt'), 'file-content');
    const artifacts = new MemoryArtifactRepository();
    const jobs = new MemoryJobRepository();
    const runner = {
      run: vi.fn(async (_command: string, args: readonly string[]) => {
        const fileArg = args.find((arg) => arg.startsWith('--file='));
        await writeFile(fileArg?.slice('--file='.length) ?? '', 'dump-content');
        return ok(undefined);
      }),
    };
    const service = new BackupExecutionService({ artifacts, jobs, runner });

    const result = await service.executeBackup(job, {
      databaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
      encryptionKey: 'test-encryption-key',
      managedFilesPath,
      outputDirectory,
    });

    expect(result.isOk()).toBe(true);
    expect(runner.run).toHaveBeenCalledWith(
      'pg_dump',
      expect.arrayContaining(['--format=custom', '--no-owner']),
    );
    expect(artifacts.artifacts[0]).toMatchObject({
      backupJobId: 'backup-1',
      artifactType: 'evidence',
      encrypted: true,
      storageProvider: 'local',
    });
    expect(artifacts.artifacts[0]?.storageReference).toMatch(
      /2026-07-27_00-00_backup-1\.backup\.enc$/,
    );
    expect(await readFile(artifacts.artifacts[0]?.storageReference ?? '')).not.toContain(
      'dump-content',
    );
    await expect(access(join(outputDirectory, 'backup-1.dump'))).rejects.toThrow();
    await expect(
      access(join(outputDirectory, 'staging', 'backup-1', 'database.dump')),
    ).rejects.toThrow();
    expect(jobs.updates.some((update) => update.startsWith('running:backup-1'))).toBe(true);
    expect(jobs.updates.some((update) => update.startsWith('succeeded:backup-1'))).toBe(true);
  });

  it('should store encrypted artifacts through the configured storage port', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'tempot-backup-'));
    const artifacts = new MemoryArtifactRepository();
    const jobs = new MemoryJobRepository();
    const storage: BackupStoragePort = {
      storeArtifact: vi.fn(async () =>
        ok({
          storageReference: 'backup-1.backup.enc',
          sizeBytes: 100,
          checksum: 'sha256:stored',
        }),
      ),
      loadArtifact: vi.fn(async () => ok(Buffer.from('encrypted'))),
    };
    const runner = {
      run: vi.fn(async (_command: string, args: readonly string[]) => {
        const fileArg = args.find((arg) => arg.startsWith('--file='));
        await writeFile(fileArg?.slice('--file='.length) ?? '', 'dump-content');
        return ok(undefined);
      }),
    };
    const service = new BackupExecutionService({ artifacts, jobs, runner, storage });

    const result = await service.executeBackup(job, {
      databaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
      encryptionKey: 'test-encryption-key',
      outputDirectory,
    });

    expect(result.isOk()).toBe(true);
    expect(storage.storeArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactName: '2026-07-27_00-00_backup-1.backup.enc',
        artifactType: 'evidence',
        encrypted: true,
      }),
    );
    expect(artifacts.artifacts[0]?.storageReference).toBe('backup-1.backup.enc');
  });
});
