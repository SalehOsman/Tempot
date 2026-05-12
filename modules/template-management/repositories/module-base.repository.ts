import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';

interface ModuleDelegateMethods {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Module-level base repository for template-management models. These models do
 * not all share the root audit/soft-delete columns assumed by BaseRepository.
 */
export abstract class ModuleBaseRepository<T extends { id: string }> extends BaseRepository<T> {
  protected hasSoftDelete = false;

  override async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.moduleDelegate.findUnique({
        where: this.withSoftDelete({ id }),
      });
      if (!item) {
        return err(new AppError(`${this.moduleName}.not_found`));
      }
      return ok(item as T);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.unexpected_error`, e));
    }
  }

  override async findMany(query?: Record<string, unknown>): Promise<Result<T[], AppError>> {
    try {
      const items = await this.moduleDelegate.findMany(this.toFindManyArgs(query));
      return ok(items as T[]);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.find_many_failed`, e));
    }
  }

  override async create(data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const item = (await this.moduleDelegate.create({ data: this.stripNulls(data) })) as T;
      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  override async update(id: string, data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const existing = await this.moduleDelegate.findUnique({ where: { id } });
      if (!existing) return err(new AppError(`${this.moduleName}.not_found`));

      const item = (await this.moduleDelegate.update({
        where: { id },
        data: this.stripNulls(data),
      })) as T;
      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.update_failed`, e));
    }
  }

  override async delete(id: string): Promise<Result<void, AppError>> {
    try {
      const existing = await this.moduleDelegate.findUnique({ where: { id } });
      if (!existing) return err(new AppError(`${this.moduleName}.not_found`));

      if (this.hasSoftDelete) {
        await this.moduleDelegate.update({
          where: { id },
          data: { isDeleted: true, deletedAt: new Date() },
        });
      } else {
        await this.moduleDelegate.delete({ where: { id } });
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.delete_failed`, e));
    }
  }

  private get moduleDelegate(): ModuleDelegateMethods {
    return this.model as unknown as ModuleDelegateMethods;
  }

  private toFindManyArgs(query?: Record<string, unknown>): Record<string, unknown> {
    if (!query) {
      return this.hasSoftDelete ? { where: { isDeleted: false } } : {};
    }

    if (this.isFindManyArgs(query)) {
      const where = this.asRecord(query['where']) ?? {};
      return { ...query, where: this.withSoftDelete(where) };
    }

    return { where: this.withSoftDelete(query) };
  }

  private isFindManyArgs(query: Record<string, unknown>): boolean {
    return (
      'where' in query ||
      'skip' in query ||
      'take' in query ||
      'orderBy' in query ||
      'cursor' in query
    );
  }

  private withSoftDelete(where: Record<string, unknown>): Record<string, unknown> {
    return this.hasSoftDelete ? { isDeleted: false, ...where } : where;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private stripNulls(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}
