import { err, ok } from 'neverthrow';
import type {
  BackupArtifactStoreReceipt,
  BackupArtifactStoreRequest,
  BackupStoragePort,
} from '@tempot/backup-engine';
import { LocalProvider } from '@tempot/storage-engine';

export class StorageEngineBackupStorage implements BackupStoragePort {
  private readonly provider: LocalProvider;

  constructor(basePath: string) {
    this.provider = new LocalProvider({ basePath });
  }

  async storeArtifact(request: BackupArtifactStoreRequest) {
    const uploaded = await this.provider.upload(
      request.artifactName,
      request.data,
      request.contentType,
    );
    if (uploaded.isErr()) return err(uploaded.error);
    return ok({
      storageReference: uploaded.value.providerKey,
      sizeBytes: request.sizeBytes,
      checksum: request.checksum,
    } satisfies BackupArtifactStoreReceipt);
  }

  async loadArtifact(storageReference: string) {
    const downloaded = await this.provider.download(storageReference);
    if (downloaded.isErr()) return err(downloaded.error);
    const chunks: Buffer[] = [];
    for await (const chunk of downloaded.value) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return ok(Buffer.concat(chunks));
  }
}
