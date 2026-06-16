import { BaseRepository, enforceActiveRecordScope, type RecoveryAccess } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';

interface ModuleDelegateMethods {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  count: (args: Record<string, unknown>) => Promise<number>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
}

export abstract class ModuleBaseRepository<T extends { id: string }> extends BaseRepository<T> {
  protected hasSoftDelete = false;

  override async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.moduleDelegate.findUnique({ where: this.withSoftDelete({ id }) });
      return item ? ok(item as T) : err(new AppError(`${this.moduleName}.not_found`));
    } catch (error) {
      return err(new AppError(`${this.moduleName}.unexpected_error`, error));
    }
  }

  protected override async findMany(
    query?: Record<string, unknown>,
  ): Promise<Result<T[], AppError>> {
    try {
      const items = await this.moduleDelegate.findMany(this.toFindManyArgs(query));
      return ok(items as T[]);
    } catch (error) {
      return err(new AppError(`${this.moduleName}.find_many_failed`, error));
    }
  }

  protected async countMany(query?: Record<string, unknown>): Promise<Result<number, AppError>> {
    try {
      const count = await this.moduleDelegate.count(this.toCountArgs(query));
      return ok(count);
    } catch (error) {
      return err(new AppError(`${this.moduleName}.count_failed`, error));
    }
  }

  async findDeletedById(id: string, access: RecoveryAccess): Promise<Result<T, AppError>> {
    if (!access.authorized) return err(new AppError(`${this.moduleName}.recovery_forbidden`));
    try {
      const item = await this.moduleDelegate.findUnique({ where: { id, isDeleted: true } });
      if (!item) return err(new AppError(`${this.moduleName}.not_found`));
      await this.auditLogger.log({
        action: `${this.moduleName}.${this.entityName}.recovery_read`,
        module: this.moduleName,
        targetId: id,
        recoveryActorId: access.actorId,
        recoveryActorRole: access.actorRole,
        recoveryReason: access.reason,
        status: 'SUCCESS',
      });
      return ok(item as T);
    } catch (error) {
      return err(new AppError(`${this.moduleName}.recovery_failed`, error));
    }
  }

  override async create(data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const item = await this.moduleDelegate.create({ data: this.stripUndefined(data) });
      return ok(item as T);
    } catch (error) {
      return err(new AppError(`${this.moduleName}.create_failed`, error));
    }
  }

  override async update(id: string, data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const existing = await this.moduleDelegate.findUnique({ where: { id } });
      if (!existing) return err(new AppError(`${this.moduleName}.not_found`));
      const item = await this.moduleDelegate.update({
        where: { id },
        data: this.stripUndefined(data),
      });
      return ok(item as T);
    } catch (error) {
      return err(new AppError(`${this.moduleName}.update_failed`, error));
    }
  }

  private get moduleDelegate(): ModuleDelegateMethods {
    return this.model as unknown as ModuleDelegateMethods;
  }

  private toFindManyArgs(query?: Record<string, unknown>): Record<string, unknown> {
    if (!query) return this.hasSoftDelete ? { where: { isDeleted: false } } : {};
    if (this.isFindManyArgs(query)) {
      const where = this.asRecord(query['where']) ?? {};
      return { ...query, where: this.withSoftDelete(where) };
    }
    return { where: this.withSoftDelete(query) };
  }

  private toCountArgs(query?: Record<string, unknown>): Record<string, unknown> {
    if (!query) return this.hasSoftDelete ? { where: { isDeleted: false } } : {};
    if (this.isFindManyArgs(query)) {
      const where = this.asRecord(query['where']) ?? {};
      return { where: this.withSoftDelete(where) };
    }
    return { where: this.withSoftDelete(query) };
  }

  private isFindManyArgs(query: Record<string, unknown>): boolean {
    return 'where' in query || 'skip' in query || 'take' in query || 'orderBy' in query;
  }

  private withSoftDelete(where: Record<string, unknown>): Record<string, unknown> {
    return this.hasSoftDelete ? enforceActiveRecordScope(where) : where;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
  }
}
