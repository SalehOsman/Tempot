import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  BACKUP_LIFECYCLE_EVENTS,
  type BackupAuditPort,
  type BackupEventPublisher,
  type BackupNotifierPort,
  type BackupSettingsPort,
  type BackupStoragePort,
} from '../../src/index.js';

describe('Backup engine ports', () => {
  it('should expose lifecycle event names as stable package constants', () => {
    expect(BACKUP_LIFECYCLE_EVENTS.JOB_REQUESTED).toBe('backup.job.requested');
    expect(BACKUP_LIFECYCLE_EVENTS.RESTORE_REHEARSAL_FAILED).toBe('restore.rehearsal.failed');
  });

  it('should allow storage adapters to persist opaque artifact references', async () => {
    const storage: BackupStoragePort = {
      storeArtifact: async (request) => {
        return ok({
          storageReference: `backup://${request.backupJobId}/${request.artifactName}`,
          sizeBytes: request.sizeBytes,
          checksum: request.checksum,
        });
      },
      loadArtifact: async () => ok(Buffer.from('artifact')),
    };

    const result = await storage.storeArtifact({
      backupJobId: 'backup-1',
      artifactName: 'manifest.json',
      artifactType: 'manifest',
      contentType: 'application/json',
      checksum: 'sha256:abc',
      data: Buffer.from('{}'),
      encrypted: true,
      sizeBytes: 100,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().storageReference).toBe('backup://backup-1/manifest.json');
  });

  it('should expose notifier, event, settings, and audit contracts', async () => {
    const notifier: BackupNotifierPort = {
      notify: async () => ok(undefined),
    };
    const events: BackupEventPublisher = {
      publish: async () => ok(undefined),
    };
    const settings: BackupSettingsPort = {
      getBackupSchedule: async () => ok('0 2 * * *'),
    };
    const audit: BackupAuditPort = {
      record: async () => ok(undefined),
    };

    await expect(
      notifier.notify({ templateKey: 'backup.succeeded', metadata: {} }),
    ).resolves.toEqual(ok(undefined));
    await expect(
      events.publish('backup.job.succeeded', { backupJobId: 'backup-1' }),
    ).resolves.toEqual(ok(undefined));
    await expect(settings.getBackupSchedule()).resolves.toEqual(ok('0 2 * * *'));
    await expect(audit.record({ action: 'backup.request', status: 'succeeded' })).resolves.toEqual(
      ok(undefined),
    );
  });
});
