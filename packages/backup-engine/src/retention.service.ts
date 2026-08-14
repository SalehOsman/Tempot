import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';
import type {
  BackupRetentionCandidate,
  BackupRetentionPreview,
  BackupRetentionPreviewCommand,
} from './backup-engine.types.js';

const DAY_MS = 86_400_000;

export class BackupRetentionService {
  preview(command: BackupRetentionPreviewCommand): Result<BackupRetentionPreview> {
    if (command.retentionDays <= 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_RETENTION));
    }

    const latestComplete = this.findLatestComplete(command.candidates);
    const cutoff = command.now.getTime() - command.retentionDays * DAY_MS;
    const expired = command.candidates.filter((candidate) => {
      const isLatest = candidate.artifactId === latestComplete?.artifactId;
      return !isLatest && new Date(candidate.createdAt).getTime() < cutoff;
    });

    return ok({
      artifactIdsToDelete: expired.map((candidate) => candidate.artifactId),
      protectedArtifactIds: latestComplete ? [latestComplete.artifactId] : [],
    });
  }

  private findLatestComplete(
    candidates: readonly BackupRetentionCandidate[],
  ): BackupRetentionCandidate | undefined {
    return candidates
      .filter((candidate) => candidate.isUsableCompleteBackup)
      .sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })[0];
  }
}
