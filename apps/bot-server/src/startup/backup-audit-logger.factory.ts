import type { AuditLogRepository } from '@tempot/database';

export function createBackupAuditLogger(auditLogRepository: AuditLogRepository) {
  return {
    log: async (data: Record<string, unknown>) => {
      const result = await auditLogRepository.create(data);
      if (result.isErr()) throw result.error;
    },
  };
}
