import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';

/**
 * Module-level base repository that overrides create/update to skip
 * createdBy/updatedBy fields which are not present in template-management models.
 * The root BaseRepository injects these audit fields but they only exist on
 * models following the user-management pattern.
 */
export abstract class ModuleBaseRepository<T extends { id: string }> extends BaseRepository<T> {
  override async create(data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const delegate = this.model as unknown as {
        create: (args: Record<string, unknown>) => Promise<unknown>;
      };
      const item = (await delegate.create({ data: this.stripNulls(data) })) as T;
      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }

  override async update(id: string, data: Record<string, unknown>): Promise<Result<T, AppError>> {
    try {
      const delegate = this.model as unknown as {
        update: (args: Record<string, unknown>) => Promise<unknown>;
        findUnique: (args: Record<string, unknown>) => Promise<unknown>;
      };
      const existing = await delegate.findUnique({ where: { id } });
      if (!existing) return err(new AppError(`${this.moduleName}.not_found`));

      const item = (await delegate.update({
        where: { id },
        data: this.stripNulls(data),
      })) as T;
      return ok(item);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.update_failed`, e));
    }
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
