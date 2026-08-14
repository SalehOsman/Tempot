import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { ModuleBaseRepository } from './module-base.repository.js';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category.types.js';
import { MAX_CATEGORY_DEPTH } from '../types/category.types.js';

export class CategoryRepository extends ModuleBaseRepository<Category> {
  protected moduleName = 'template-management';
  protected entityName = 'category';
  protected override hasSoftDelete = true;

  protected get model() {
    return (this.db as Record<string, unknown>)['category'] as object;
  }

  async findBySlug(slug: string): Promise<Result<Category, AppError>> {
    const result = await this.findMany({ slug });
    if (result.isErr()) return err(result.error);
    const category = result.value[0];
    if (!category) return err(new AppError('template-management.category_not_found', { slug }));
    return ok(category);
  }

  async listHierarchy(): Promise<Result<Category[], AppError>> {
    return this.findMany();
  }

  async listByParent(parentId: string | null): Promise<Result<Category[], AppError>> {
    const where = parentId ? { parentId } : { parentId: null };
    return this.findMany(where);
  }

  async createCategory(input: CreateCategoryInput): Promise<Result<Category, AppError>> {
    if (input.parentId) {
      const parentResult = await this.findById(input.parentId);
      if (parentResult.isErr()) return err(parentResult.error);
      if (parentResult.value.depth >= MAX_CATEGORY_DEPTH) {
        return err(new AppError('template-management.category_depth_exceeded'));
      }
    }

    const depth = input.parentId ? (await this.getParentDepth(input.parentId)) + 1 : 0;
    const slug = this.slugify(input.nameEn);

    return this.create({
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      slug,
      icon: input.icon ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
      depth,
    });
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Result<Category, AppError>> {
    const data: Record<string, unknown> = {};
    if (input.nameAr !== undefined) data['nameAr'] = input.nameAr;
    if (input.nameEn !== undefined) data['nameEn'] = input.nameEn;
    if (input.icon !== undefined) data['icon'] = input.icon;
    if (input.sortOrder !== undefined) data['sortOrder'] = input.sortOrder;
    return this.update(id, data);
  }

  async softDeleteCategory(id: string): Promise<Result<void, AppError>> {
    const result = await this.update(id, { isDeleted: true });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  private async getParentDepth(parentId: string): Promise<number> {
    const result = await this.findById(parentId);
    if (result.isErr()) return 0;
    return result.value.depth;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
