import { AsyncResult, AppError, sessionContext, generateErrorReference } from '@tempot/shared';
import { AuditLogRepository } from '@tempot/database';
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
  referenceCode?: string;
}

/**
 * Service for persisting critical state changes to the database.
 * Rule: LVII (Audit Log)
 */
export class AuditLogger {
  constructor(private readonly repository: AuditLogRepository) {}

  /**
   * Log a state change. Automatically merges user identity from session context.
   * Rule XXIV: Auto-generates referenceCode for non-SUCCESS entries.
   */
  async log(entry: AuditLogEntry): AsyncResult<void> {
    const store = sessionContext.getStore();
    const status = entry.status ?? 'SUCCESS';
    const referenceCode = this.resolveReferenceCode(entry, status);

    const result = await this.repository.create({
      action: entry.action,
      module: entry.module,
      targetId: entry.targetId,
      before: entry.before,
      after: entry.after,
      status,
      userId: entry.userId ?? store?.userId,
      userRole: entry.userRole ?? store?.userRole,
      referenceCode,
    });

    if (result.isErr()) {
      return err(new AppError('logger.audit_log_failed', result.error));
    }

    return ok(undefined);
  }

  /**
   * Resolves the reference code: uses provided value, auto-generates
   * for non-SUCCESS entries, or returns undefined for SUCCESS.
   */
  private resolveReferenceCode(entry: AuditLogEntry, status: string): string | undefined {
    if (entry.referenceCode) {
      return entry.referenceCode;
    }
    if (status !== 'SUCCESS') {
      return generateErrorReference();
    }
    return undefined;
  }
}
