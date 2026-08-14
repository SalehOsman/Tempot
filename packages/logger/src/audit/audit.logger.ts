import { AsyncResult, AppError, sessionContext, generateErrorReference } from '@tempot/shared';
import {
  AuditLogRepository,
  buildSafeAuditSnapshot,
  type ProtectedAuditChange,
} from '@tempot/database';
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
  changes?: ProtectedAuditChange[];
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
      before: this.sanitizeSnapshot(entry.before),
      after: this.buildPersistedAfter(entry),
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

  private buildPersistedAfter(entry: AuditLogEntry): Record<string, unknown> | null | undefined {
    if (entry.after === null && (!entry.changes || entry.changes.length === 0)) return null;
    if (entry.after === undefined && (!entry.changes || entry.changes.length === 0)) {
      return undefined;
    }
    return buildSafeAuditSnapshot({
      ...(entry.after ?? {}),
      changes: entry.changes,
    });
  }

  private sanitizeSnapshot(
    value: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null | undefined {
    if (value === null || value === undefined) return value;
    return buildSafeAuditSnapshot(value);
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
