import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { sessionContext } from '@tempot/session-manager/context';
import { prisma, Prisma, PrismaClient } from '../prisma/client.js';

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
 *
 * Prisma 7 delegates use deeply-branded generics (Exact<A, Args<T, 'findUnique'>>)
 * that cannot be expressed as a simple TypeScript interface without `any`.
 * We use `object` as the public constraint — subclasses return Prisma delegates,
 * and BaseRepository accesses methods through the `delegate` accessor which
 * performs a single type assertion at the call boundary.
 *
 * PRISMA-BOUNDARY: No `any` in @tempot/database. Type assertions at call boundary only.
 * When Prisma provides a proper base delegate type, replace this alias.
 *
 * @see https://github.com/prisma/prisma/issues/20798
 */
export type PrismaModelDelegate = object;

/**
 * Internal callable shape for Prisma delegate methods used by BaseRepository.
 * Kept private to this module — consumers use PrismaModelDelegate (Record<string, unknown>).
 */
interface PrismaDelegateMethods {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Abstract Base Repository with Result pattern and Audit Log triggers
 * Rules: XIV (Repository Pattern), XXI (Result Pattern), LVII (Audit Log)
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract moduleName: string;
  protected abstract entityName: string;

  /**
   * Database client (can be standard prisma client or transaction client)
   */
  constructor(
    protected auditLogger: IAuditLogger,
    protected db: DatabaseClient = prisma,
  ) {}

  /**
   * The Prisma model delegate for this entity.
   * Must be implemented by subclasses to return the correct model from this.db.
   */
  protected abstract get model(): PrismaModelDelegate;

  /**
   * PRISMA-BOUNDARY: Type assertion at call boundary only.
   * Casts the opaque PrismaModelDelegate to callable methods for internal use.
   */
  private get delegate(): PrismaDelegateMethods {
    return this.model as unknown as PrismaDelegateMethods;
  }

  /**
   * Create a new instance of this repository using a transaction client
   */
  withTransaction(tx: Prisma.TransactionClient): this {
    const RepositoryClass = this.constructor as new (
      auditLogger: IAuditLogger,
      db: Prisma.TransactionClient,
    ) => this;
    return new RepositoryClass(this.auditLogger, tx);
  }

  /**
   * Helper to get user context from session
   */
  protected getContext() {
    const store = sessionContext.getStore();
    return {
      userId: store?.userId || null,
      userRole: store?.userRole || null,
    };
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
    const { userId, userRole } = this.getContext();
    try {
      const item = (await this.delegate.create({
        data: {
          ...data,
          createdBy: userId,
        },
      })) as T;

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.create`,
        module: this.moduleName,
        targetId: item.id,
        after: item as unknown as Record<string, unknown>,
        status: 'SUCCESS',
      });

      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  async update(id: string, data: Record<string, unknown>): Promise<Result<T, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      // Get before state for audit log
      const before = await this.delegate.findUnique({ where: { id } });
      if (!before) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }

      const item = (await this.delegate.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      })) as T;

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.update`,
        module: this.moduleName,
        targetId: id,
        before: before as unknown as Record<string, unknown>,
        after: item as unknown as Record<string, unknown>,
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
      const before = await this.delegate.findUnique({ where: { id } });
      if (!before) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }

      // Pass deletedBy to the delete call (extension will pick it up)
      await this.delegate.delete({
        where: { id },
        data: {
          deletedBy: userId,
        },
      });

      // Trigger Audit Log
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.delete`,
        module: this.moduleName,
        targetId: id,
        before: before as unknown as Record<string, unknown>,
        status: 'SUCCESS',
      });

      return ok(undefined);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.delete_failed`, e));
    }
  }
}
