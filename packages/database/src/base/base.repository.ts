import { Result, ok, err } from 'neverthrow';
import { AppError, sessionContext } from '@tempot/shared';
import { prisma, Prisma, PrismaClient } from '../prisma/prisma.client.js';
import { buildProtectedAuditChanges, buildSafeAuditSnapshot } from './audit.policy.js';
import type { RecoveryAccess } from './recovery.types.js';
import { enforceActiveRecordScope } from './soft-delete.js';

export type DatabaseClient =
  | InstanceType<typeof PrismaClient>
  | Prisma.TransactionClient
  | typeof prisma;

export interface IAuditLogger {
  log: (data: Record<string, unknown>) => Promise<void>;
}
/*

 * without `any`. We use `object` — subclasses return Prisma delegates,
*/
export type PrismaModelDelegate = object;

interface PrismaDelegateMethods {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected abstract moduleName: string;
  protected abstract entityName: string;

  constructor(
    protected auditLogger: IAuditLogger,
    protected db: DatabaseClient = prisma,
  ) {}

  protected abstract get model(): PrismaModelDelegate;

  private get delegate(): PrismaDelegateMethods {
    return this.model as unknown as PrismaDelegateMethods;
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    const RepositoryClass = this.constructor as new (
      auditLogger: IAuditLogger,
      db: Prisma.TransactionClient,
    ) => this;
    return new RepositoryClass(this.auditLogger, tx);
  }

  protected getContext() {
    const store = sessionContext.getStore();
    return {
      userId: store?.userId || null,
      userRole: store?.userRole || null,
    };
  }

  private async logAudit(action: string, entry: Record<string, unknown>): Promise<void> {
    const { userId, userRole } = this.getContext();
    await this.auditLogger.log({
      userId,
      userRole,
      action: `${this.moduleName}.${this.entityName}.${action}`,
      module: this.moduleName,
      ...entry,
      status: 'SUCCESS',
    });
  }

  async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.delegate.findUnique({
        where: { id, isDeleted: false },
      });
      if (!item) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }
      return ok(item as T);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.unexpected_error`, e));
    }
  }

  async findDeletedById(id: string, access: RecoveryAccess): Promise<Result<T, AppError>> {
    if (!access.authorized) return err(new AppError(`${this.moduleName}.recovery_forbidden`));
    try {
      const item = await this.delegate.findUnique({ where: { id, isDeleted: true } });
      if (!item) return err(new AppError(`${this.moduleName}.not_found`));
      await this.logAudit('recovery_read', {
        targetId: id,
        recoveryActorId: access.actorId,
        recoveryActorRole: access.actorRole,
        recoveryReason: access.reason,
        after: buildSafeAuditSnapshot(item),
      });
      return ok(item as T);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.recovery_failed`, e));
    }
  }

  protected async findMany(where?: Record<string, unknown>): Promise<Result<T[], AppError>> {
    try {
      const isFindManyArgs =
        where && ('where' in where || 'skip' in where || 'take' in where || 'orderBy' in where);
      const nestedWhere = isFindManyArgs ? where['where'] : undefined;
      const queryWhere =
        typeof nestedWhere === 'object' && nestedWhere !== null && !Array.isArray(nestedWhere)
          ? (nestedWhere as Record<string, unknown>)
          : {};
      const args = isFindManyArgs
        ? { ...where, where: enforceActiveRecordScope(queryWhere) }
        : { where: enforceActiveRecordScope(where) };
      const items = await this.delegate.findMany(args);
      return ok(items as T[]);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.find_many_failed`, e));
    }
  }

  async create(data: Record<string, unknown>): Promise<Result<T, AppError>> {
    const { userId } = this.getContext();
    try {
      const item = (await this.delegate.create({
        data: { ...data, createdBy: userId },
      })) as T;

      await this.logAudit('create', {
        targetId: item.id,
        after: buildSafeAuditSnapshot(item),
        changes: buildProtectedAuditChanges(null, item as unknown as Record<string, unknown>),
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  async update(id: string, data: Record<string, unknown>): Promise<Result<T, AppError>> {
    const { userId } = this.getContext();
    try {
      const before = await this.delegate.findUnique({ where: { id } });
      if (!before) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }

      const item = (await this.delegate.update({
        where: { id },
        data: { ...data, updatedBy: userId },
      })) as T;

      await this.logAudit('update', {
        targetId: id,
        before: buildSafeAuditSnapshot(before),
        after: buildSafeAuditSnapshot(item),
        changes: buildProtectedAuditChanges(
          before as Record<string, unknown>,
          item as unknown as Record<string, unknown>,
        ),
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.update_failed`, e));
    }
  }

  async delete(id: string): Promise<Result<void, AppError>> {
    const { userId } = this.getContext();
    try {
      const before = await this.delegate.findUnique({ where: { id } });
      if (!before) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }

      await this.delegate.delete({
        where: { id },
        data: { deletedBy: userId },
      });

      await this.logAudit('delete', {
        targetId: id,
        before: buildSafeAuditSnapshot(before),
        changes: buildProtectedAuditChanges(before as Record<string, unknown>, null),
      });

      return ok(undefined);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.delete_failed`, e));
    }
  }
}
