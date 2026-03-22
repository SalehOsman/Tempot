import { AsyncResult, AppError } from '@tempot/shared';
import { PrismaClient } from '@prisma/client';
import { sessionContext } from '@tempot/session-manager';
import { ok, err } from 'neverthrow';

/**
 * Interface for Audit Log entries based on Rule LVII
 */
export interface AuditLogEntry {
  action: string;
  module: string;
  targetId?: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  before?: any;
  after?: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  status?: string;
  userId?: string;
  userRole?: string;
}

/**
 * Service for persisting critical state changes to the database.
 * Rule: LVII (Audit Log)
 */
export class AuditLogger {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Log a state change. Automatically merges user identity from session context.
   */
  async log(entry: AuditLogEntry): AsyncResult<void> {
    try {
      const store = sessionContext.getStore();

      /* eslint-disable @typescript-eslint/no-explicit-any */
      await (this.prisma as any).auditLog.create({
        data: {
          action: entry.action,
          module: entry.module,
          targetId: entry.targetId,
          before: entry.before,
          after: entry.after,
          status: entry.status || 'SUCCESS',
          userId: entry.userId || store?.userId,
          userRole: entry.userRole || store?.userRole,
          timestamp: new Date(),
        },
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */

      return ok(undefined);
    } catch (e) {
      // Rule XXIII: We don't necessarily want to fail the whole operation if audit log fails,
      // but we should return an error Result so the caller can decide.
      return err(new AppError('logger.audit_log_failed', e));
    }
  }
}
