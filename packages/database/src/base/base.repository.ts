import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { sessionContext } from '@tempot/session-manager';

/**
 * Abstract Base Repository with Result pattern and Audit Log triggers
 * Rules: XIV (Repository Pattern), XXI (Result Pattern), LVII (Audit Log)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class BaseRepository<T> {
  protected abstract model: any;
  protected abstract moduleName: string;
  protected abstract entityName: string;

  constructor(protected auditLogger: any) {}

  /**
   * Helper to get user context from session
   */
  protected getContext() {
    const store = sessionContext.getStore();
    return {
      userId: store?.userId,
      userRole: store?.userRole,
    };
  }

  async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.model.findUnique({
        where: { id, isDeleted: false },
      });
      if (!item) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }
      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.unexpected_error`, e));
    }
  }

  async create(data: any): Promise<Result<T, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      const item = await this.model.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.create`,
        module: this.moduleName,
        targetId: (item as any).id,
        after: item,
        status: 'SUCCESS',
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  async update(id: string, data: any): Promise<Result<T, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      // Get before state for audit log
      const before = await this.model.findUnique({ where: { id } });

      const item = await this.model.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.update`,
        module: this.moduleName,
        targetId: id,
        before,
        after: item,
        status: 'SUCCESS',
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.update_failed`, e));
    }
  }

  async delete(id: string): Promise<Result<void, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      const before = await this.model.findUnique({ where: { id } });

      await this.model.delete({
        where: { id },
      });

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.delete`,
        module: this.moduleName,
        targetId: id,
        before,
        status: 'SUCCESS',
      });

      return ok(undefined);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.delete_failed`, e));
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
