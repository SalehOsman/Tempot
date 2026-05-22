import { AuditLogRepository } from '@tempot/database';
import type { AuditEntry } from '../bot/middleware/audit.middleware.js';
import type { ModuleLogger } from '../bot-server.types.js';

export function createAuditLogWriter(log: ModuleLogger): (entry: AuditEntry) => Promise<void> {
  const repository = new AuditLogRepository({ log: async () => {} });

  return async (entry: AuditEntry): Promise<void> => {
    const result = await repository.create({
      userId: entry.userId,
      userRole: entry.userRole,
      action: entry.action,
      module: entry.module,
      targetId: entry.targetId,
      before: entry.before,
      after: entry.after,
      status: entry.status,
    });

    if (result.isErr()) {
      log.warn({
        code: 'bot-server.audit_persist_failed',
        action: entry.action,
        module: entry.module,
        targetId: entry.targetId,
        error: result.error.code,
      });
    }
  };
}
