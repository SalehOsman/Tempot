import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { Tag } from '../types/category.types.js';

export class TagRepository extends BaseRepository<Tag> {
  protected moduleName = 'template-management';
  protected entityName = 'tag';

  protected get model() {
    return (this.db as Record<string, unknown>)['tag'] as object;
  }

  async findBySlug(slug: string): Promise<Result<Tag, AppError>> {
    const result = await this.findMany({ slug });
    if (result.isErr()) return err(result.error);
    const tag = result.value[0];
    if (!tag) return err(new AppError('template-management.tag_not_found', { slug }));
    return ok(tag);
  }

  async findByName(name: string): Promise<Result<Tag | null, AppError>> {
    const result = await this.findMany({ name });
    if (result.isErr()) return err(result.error);
    return ok(result.value[0] ?? null);
  }

  async createOrFind(name: string): Promise<Result<Tag, AppError>> {
    const existing = await this.findByName(name);
    if (existing.isErr()) return err(existing.error);
    if (existing.value) return ok(existing.value);

    const slug = this.slugify(name);
    return this.create({ name, slug, usageCount: 0 });
  }

  async incrementUsage(id: string): Promise<Result<void, AppError>> {
    const findResult = await this.findById(id);
    if (findResult.isErr()) return err(findResult.error);
    const result = await this.update(id, { usageCount: findResult.value.usageCount + 1 });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async listPopular(_limit: number = 20): Promise<Result<Tag[], AppError>> {
    return this.findMany({});
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
