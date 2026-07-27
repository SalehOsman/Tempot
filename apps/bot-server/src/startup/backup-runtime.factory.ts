import type { AuditLogRepository } from '@tempot/database';
import {
  BackupArtifactRepository,
  BackupEngineService,
  BackupExecutionService,
  BackupJobRepository,
  DatabaseFactoryResetService,
  NodeBackupCommandRunner,
  ProductionRestoreExecutionService,
  RestoreExecutionService,
  RestoreRehearsalRepository,
} from '@tempot/backup-engine';
import { createBackupAuditLogger } from './backup-audit-logger.factory.js';
import {
  resolveActiveJobStaleAfterMs,
  resolveBackupStoragePath,
} from './backup-operations.config.js';
import { StorageEngineBackupStorage } from './backup-storage.adapter.js';

export function createBackupRuntime(auditLogRepository: AuditLogRepository) {
  const auditLogger = createBackupAuditLogger(auditLogRepository);
  const jobs = new BackupJobRepository(auditLogger);
  const artifacts = new BackupArtifactRepository(auditLogger);
  const runner = new NodeBackupCommandRunner();
  const storage = new StorageEngineBackupStorage(resolveBackupStoragePath());
  const rehearsals = new RestoreRehearsalRepository(auditLogger);
  const backupEngine = new BackupEngineService({
    activeJobStaleAfterMs: resolveActiveJobStaleAfterMs(),
    jobs,
  });

  return {
    backupEngine,
    backupExecution: new BackupExecutionService({ artifacts, jobs, runner, storage }),
    databaseFactoryReset: new DatabaseFactoryResetService({ runner }),
    productionRestoreExecution: new ProductionRestoreExecutionService({
      artifacts,
      rehearsals,
      runner,
      storage,
    }),
    restoreExecution: new RestoreExecutionService({ artifacts, rehearsals, runner, storage }),
  };
}
