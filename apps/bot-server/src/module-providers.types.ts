import type {
  BackupArtifact,
  BackupJob,
  BackupListResult,
  DatabaseFactoryResetResult,
  ProductionRestoreResult,
  RestoreRehearsal,
} from '@tempot/backup-engine';
import type { UserRole } from '@tempot/module-registry';

export type BackupOperationResult<T> =
  | {
      success: true;
      value: T;
    }
  | {
      success: false;
      error: { code: string };
    };

export interface BackupOperationsProvider {
  requestBackup: (actorId: string) => Promise<
    BackupOperationResult<{
      job: BackupJob;
      artifact?: BackupArtifact;
      storageReference?: string;
    }>
  >;
  listBackups: (limit: number) => Promise<BackupOperationResult<BackupListResult>>;
  restoreLatest: (actorId: string) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreProductionBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<ProductionRestoreResult>>;
  factoryResetDatabase: (
    actorId: string,
  ) => Promise<BackupOperationResult<DatabaseFactoryResetResult>>;
}

export interface HelpAssistantQuestion {
  question: string;
  userId: string;
  chatId: string;
  role: UserRole;
  locale: string;
}

export interface HelpAssistantAnswer {
  state: 'answered' | 'no-context' | 'degraded';
  answer: string;
  citations: readonly { blockId: string; sourceId?: string }[];
  confidence: number;
}

export type HelpAssistantResult =
  | { success: true; value: HelpAssistantAnswer }
  | { success: false; error: { code: string } };

export interface HelpAssistantProvider {
  ask(input: HelpAssistantQuestion): Promise<HelpAssistantResult>;
}
