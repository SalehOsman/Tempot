import { AuditLog, Prisma } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BaseRepository } from '../base/base.repository';

/**
 * Repository for Audit Log entity
 * Resolves ISSUE-005 (Rule XIV)
 */
export class AuditLogRepository extends BaseRepository<AuditLog> {
  protected moduleName = 'database';
  protected entityName = 'auditLog';

  protected get model() {
    return this.db.auditLog;
  }

  /**
   * Override create to prevent infinite audit loops (Rule LVII)
   * It should NOT call this.auditLogger.log
   */
  async create(data: Record<string, unknown>): Promise<Result<AuditLog, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      // Direct call to model.create without calling this.auditLogger.log
      const beforeVal = data.before as Prisma.InputJsonValue;
      const afterVal = data.after as Prisma.InputJsonValue;

      const item = await this.model.create({
        data: {
          userId: (data.userId as string) || userId || null,
          userRole: (data.userRole as string) || userRole || null,
          action: (data.action as string) || 'UNKNOWN',
          module: (data.module as string) || this.moduleName,
          targetId: data.targetId as string | undefined,
          before: beforeVal,
          after: afterVal,
          status: (data.status as string) || 'SUCCESS',
        },
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  /**
   * Audit logs are immutable and don't support soft delete.
   * Overriding findById to avoid using isDeleted field which doesn't exist on AuditLog.
   */
  async findById(id: string): Promise<Result<AuditLog, AppError>> {
    try {
      const item = await this.model.findUnique({
        where: { id },
      });
      if (!item) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }
      return ok(item as AuditLog);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.unexpected_error`, e));
    }
  }

  /**
   * Update not supported for AuditLog (immutable records)
   */
  async update(): Promise<Result<AuditLog, AppError>> {
    return err(new AppError(`${this.moduleName}.update_not_supported`));
  }

  /**
   * Delete not supported for AuditLog (immutable records)
   */
  async delete(): Promise<Result<void, AppError>> {
    return err(new AppError(`${this.moduleName}.delete_not_supported`));
  }
}
