import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type { BackupManifest, BackupManifestCommand } from './backup-engine.types.js';

const MANIFEST_SCHEMA_VERSION = '1';
const SENSITIVE_METADATA_MARKERS = ['://', 'password', 'secret', 'token', 'key='];

export class BackupManifestService {
  createManifest(command: BackupManifestCommand): Result<BackupManifest> {
    if (this.containsSensitiveMetadata(command.sourceEnvironment)) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.UNSAFE_METADATA));
    }

    return ok({
      backupJobId: command.backupJobId,
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      sourceEnvironment: command.sourceEnvironment,
      databaseIncluded: command.scope === 'complete' || command.scope === 'database',
      filesIncluded: command.scope === 'complete' || command.scope === 'files',
      protectedDataIncluded: command.scope !== 'files',
      keyVersionReferences: command.keyVersionReferences ?? [],
      migrationState: command.migrationState,
      artifactCount: command.artifacts.length,
      totalSizeBytes: this.sumArtifactSizes(command),
      integrityStatus: this.resolveIntegrityStatus(command),
    });
  }

  private containsSensitiveMetadata(value: string): boolean {
    const normalized = value.toLowerCase();
    return SENSITIVE_METADATA_MARKERS.some((marker) => normalized.includes(marker));
  }

  private sumArtifactSizes(command: BackupManifestCommand): number {
    return command.artifacts.reduce((total, artifact) => total + artifact.sizeBytes, 0);
  }

  private resolveIntegrityStatus(command: BackupManifestCommand) {
    const passed = command.artifacts.every(
      (artifact) => artifact.encrypted && artifact.checksum.trim().length > 0,
    );
    return passed ? 'passed' : 'failed';
  }
}
