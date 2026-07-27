import { describe, expect, it } from 'vitest';
import {
  BACKUP_ENGINE_ERRORS,
  BackupRetentionService,
  type BackupRetentionCandidate,
} from '../../src/index.js';

describe('BackupRetentionService', () => {
  it('should select expired artifacts while preserving recent records', () => {
    const service = new BackupRetentionService();
    const candidates: BackupRetentionCandidate[] = [
      {
        artifactId: 'old-db',
        backupJobId: 'backup-old',
        scope: 'database',
        createdAt: '2026-06-01T00:00:00.000Z',
        isUsableCompleteBackup: false,
      },
      {
        artifactId: 'new-db',
        backupJobId: 'backup-new',
        scope: 'database',
        createdAt: '2026-07-20T00:00:00.000Z',
        isUsableCompleteBackup: false,
      },
    ];

    const result = service.preview({
      candidates,
      now: new Date('2026-07-26T00:00:00.000Z'),
      retentionDays: 30,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().artifactIdsToDelete).toEqual(['old-db']);
  });

  it('should never delete the latest usable complete backup', () => {
    const service = new BackupRetentionService();
    const candidates: BackupRetentionCandidate[] = [
      {
        artifactId: 'complete-latest',
        backupJobId: 'backup-latest',
        scope: 'complete',
        createdAt: '2026-06-01T00:00:00.000Z',
        isUsableCompleteBackup: true,
      },
    ];

    const result = service.preview({
      candidates,
      now: new Date('2026-07-26T00:00:00.000Z'),
      retentionDays: 30,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().protectedArtifactIds).toEqual(['complete-latest']);
    expect(result._unsafeUnwrap().artifactIdsToDelete).toEqual([]);
  });

  it('should reject non-positive retention windows', () => {
    const service = new BackupRetentionService();

    const result = service.preview({
      candidates: [],
      now: new Date('2026-07-26T00:00:00.000Z'),
      retentionDays: 0,
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BACKUP_ENGINE_ERRORS.INVALID_RETENTION);
  });
});
