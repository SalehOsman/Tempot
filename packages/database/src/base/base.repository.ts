import { Result, ok, err } from 'neverthrow';
import { AppError, sessionContext } from '@tempot/shared';
import { prisma, Prisma, PrismaClient } from '../prisma/prisma.client.js';

/**
 * Database client type that accepts base PrismaClient, TransactionClient,
 * or the extended client (from $extends()) used by the prisma proxy.
 */
type DatabaseClient = PrismaClient | Prisma.TransactionClient | typeof prisma;

/**
 * Local interface for Audit Logger to avoid circular dependencies
 */
export interface IAuditLogger {
  log: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * Opaque type alias for a Prisma model delegate.
 * Prisma 7 delegates use deeply-branded generics that cannot be expressed
 * without `any`. We use `object` — subclasses return Prisma delegates,
 * and BaseRepository casts at the call boundary via `delegate`.
 *
 * PRISMA-BOUNDARY: No `any` in @tempot/database.
 * @see https://github.com/prisma/prisma/issues/20798
 */
export type PrismaModelDelegate = object;

/** Internal callable shape for Prisma delegate methods used by BaseRepository. */
interface PrismaDelegateMethods {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Abstract Base Repository with Result pattern and Audit Log triggers.
 * Rules: XIV (Repository Pattern), XXI (Result Pattern), LVII (Audit Log)
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract moduleName: string;
  protected abstract entityName: string;

  /** Database client (can be standard prisma client or transaction client) */
  constructor(
    protected auditLogger: IAuditLogger,
    protected db: DatabaseClient = prisma,
  ) {}

  /** The Prisma model delegate for this entity. Subclasses return the correct model. */
  protected abstract get model(): PrismaModelDelegate;

  /** PRISMA-BOUNDARY: Casts opaque PrismaModelDelegate to callable methods. */
  private get delegate(): PrismaDelegateMethods {
    return this.model as unknown as PrismaDelegateMethods;
  }

  /** Create a new instance of this repository using a transaction client. */
  withTransaction(tx: Prisma.TransactionClient): this {
    const RepositoryClass = this.constructor as new (
      auditLogger: IAuditLogger,
      db: Prisma.TransactionClient,
    ) => this;
    return new RepositoryClass(this.auditLogger, tx);
  }

  /** Helper to get user context from session. */
  protected getContext() {
    const store = sessionContext.getStore();
    return {
      userId: store?.userId || null,
      userRole: store?.userRole || null,
    };
  }

  /** Logs an audit trail entry for a repository operation. */
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

  async findMany(where?: Record<string, unknown>): Promise<Result<T[], AppError>> {
    try {
      const items = await this.delegate.findMany({
        where: { isDeleted: false, ...where },
      });
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
        after: item as unknown as Record<string, unknown>,
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
        before: before as unknown as Record<string, unknown>,
        after: item as unknown as Record<string, unknown>,
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
        before: before as unknown as Record<string, unknown>,
      });

      return ok(undefined);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.delete_failed`, e));
    }
  }
}
