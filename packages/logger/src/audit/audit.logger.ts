import { AsyncResult, AppError } from '@tempot/shared';
import { AuditLogRepository } from '@tempot/database';
import { sessionContext } from '@tempot/session-manager';
import { ok, err } from 'neverthrow';

/**
 * Interface for Audit Log entries based on Rule LVII
 */
export interface AuditLogEntry {
  action: string;
  module: string;
  targetId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  status?: string;
  userId?: string;
  userRole?: string;
}

/**
 * Service for persisting critical state changes to the database.
 * Rule: LVII (Audit Log)
 */
export class AuditLogger {
  constructor(private readonly repository: AuditLogRepository) {}

  /**
   * Log a state change. Automatically merges user identity from session context.
   */
  async log(entry: AuditLogEntry): AsyncResult<void> {
    const store = sessionContext.getStore();

    const result = await this.repository.create({
      action: entry.action,
      module: entry.module,
      targetId: entry.targetId,
      before: entry.before,
      after: entry.after,
      status: entry.status ?? 'SUCCESS',
      userId: entry.userId ?? store?.userId,
      userRole: entry.userRole ?? store?.userRole,
    });

    if (result.isErr()) {
      return err(new AppError('logger.audit_log_failed', result.error));
    }

    return ok(undefined);
  }
}
