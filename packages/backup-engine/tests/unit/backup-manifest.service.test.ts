import { describe, expect, it } from 'vitest';
import {
  BACKUP_ENGINE_ERRORS,
  BackupManifestService,
  type BackupArtifactInput,
} from '../../src/index.js';

describe('BackupManifestService', () => {
  it('should create safe manifest metadata for a complete backup', () => {
    const service = new BackupManifestService();
    const artifacts: BackupArtifactInput[] = [
      {
        artifactType: 'database_dump',
        checksum: 'sha256:abc',
        encrypted: true,
        sizeBytes: 100,
      },
      {
        artifactType: 'storage_snapshot',
        checksum: 'sha256:def',
        encrypted: true,
        sizeBytes: 200,
      },
    ];

    const result = service.createManifest({
      backupJobId: 'backup-1',
      scope: 'complete',
      artifacts,
      sourceEnvironment: 'local-staging',
      migrationState: '8 migrations',
      keyVersionReferences: ['v1'],
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      backupJobId: 'backup-1',
      databaseIncluded: true,
      filesIncluded: true,
      integrityStatus: 'passed',
      totalSizeBytes: 300,
    });
  });

  it('should reject sensitive manifest metadata', () => {
    const service = new BackupManifestService();

    const result = service.createManifest({
      backupJobId: 'backup-1',
      scope: 'database',
      artifacts: [],
      sourceEnvironment: 'postgres://user:password@localhost:5432/tempot',
      migrationState: '8 migrations',
      keyVersionReferences: ['v1'],
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.UNSAFE_METADATA);
  });
});
