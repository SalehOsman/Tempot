import { describe, expect, it, vi } from 'vitest';
import { BackupArtifactRepository, type BackupArtifact } from '../../src/index.js';

const artifact = {
  id: 'artifact-1',
  backupJobId: 'backup-1',
  artifactType: 'database_dump',
  checksum: 'sha256:abc',
  encrypted: true,
  sizeBytes: 1024,
  storageAttachmentId: 'attachment-1',
  storageReference: 'backups/backup-1.backup.enc',
  storageProvider: 'local',
} satisfies BackupArtifact;

function createRepository() {
  const model = {
    create: vi.fn<[(args: Record<string, unknown>) => Promise<unknown>]>(),
    findMany: vi.fn<[(args: Record<string, unknown>) => Promise<unknown[]>]>(),
  };
  const db = { backupArtifact: model };
  const auditLogger = { log: vi.fn<(data: Record<string, unknown>) => Promise<void>>() };

  return {
    auditLogger,
    model,
    repository: new BackupArtifactRepository(auditLogger, db),
  };
}

describe('BackupArtifactRepository', () => {
  it('should persist backup artifact metadata and audit the write', async () => {
    const { auditLogger, model, repository } = createRepository();
    model.create.mockResolvedValue(artifact);

    const result = await repository.create(artifact);

    expect(result.isOk()).toBe(true);
    expect(model.create).toHaveBeenCalledWith({ data: artifact });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'backup-engine.backup-artifact.create',
        module: 'backup-engine',
        targetId: 'artifact-1',
        status: 'SUCCESS',
      }),
    );
  });

  it('should list active artifacts for a backup job in creation order', async () => {
    const { model, repository } = createRepository();
    model.findMany.mockResolvedValue([artifact]);

    const result = await repository.findByBackupJobId('backup-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([artifact]);
    expect(model.findMany).toHaveBeenCalledWith({
      where: { backupJobId: 'backup-1', isDeleted: false },
      orderBy: { createdAt: 'asc' },
    });
  });
});
