import { createHash } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { BackupArtifactStoreReceipt, BackupStoragePort } from './backup-engine.ports.js';
import type { BackupArtifactType } from './backup-engine.types.js';

export const BACKUP_CONTENT_TYPE = 'application/vnd.tempot.backup+json';

interface StoreEncryptedArtifactInput {
  readonly backupJobId: string;
  readonly artifactName: string;
  readonly artifactType: BackupArtifactType;
  readonly encryptedPayload: string;
  readonly outputDirectory: string;
  readonly storage?: BackupStoragePort;
}

export async function storeEncryptedBackupArtifact(
  input: StoreEncryptedArtifactInput,
): AsyncResult<BackupArtifactStoreReceipt> {
  const data = Buffer.from(input.encryptedPayload, 'utf8');
  const checksum = `sha256:${createHash('sha256').update(input.encryptedPayload).digest('hex')}`;
  if (input.storage) {
    return input.storage.storeArtifact({
      backupJobId: input.backupJobId,
      artifactName: input.artifactName,
      artifactType: input.artifactType,
      checksum,
      contentType: BACKUP_CONTENT_TYPE,
      data,
      encrypted: true,
      sizeBytes: data.byteLength,
    });
  }
  const storageReference = join(input.outputDirectory, input.artifactName);
  await writeFile(storageReference, input.encryptedPayload);
  return ok({ storageReference, sizeBytes: (await stat(storageReference)).size, checksum });
}
