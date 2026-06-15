import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type {
  Template,
  TemplateSearchParams,
  TemplateSearchResult,
} from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export class TemplateRepository extends ModuleBaseRepository<Template> {
  protected moduleName = 'template-management';
  protected entityName = 'template';
  protected override hasSoftDelete = true;

  protected get model() {
    return (this.db as Record<string, unknown>)['template'] as object;
  }

  async findBySlug(slug: string): Promise<Result<Template, AppError>> {
    const result = await this.findMany({ slug });
    if (result.isErr()) return err(result.error);
    const template = result.value[0];
    if (!template) return err(new AppError('template-management.not_found', { slug }));
    return ok(template);
  }

  async findByAuthor(
    authorId: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<TemplateSearchResult, AppError>> {
    const where = { authorId };
    const itemsResult = await this.findMany({ where, skip: page * pageSize, take: pageSize });
    if (itemsResult.isErr()) return err(itemsResult.error);

    const countResult = await this.findMany({ where });
    if (countResult.isErr()) return err(countResult.error);

    return ok({
      templates: itemsResult.value,
      totalCount: countResult.value.length,
      page,
      pageSize,
    });
  }

  async findPublished(
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<TemplateSearchResult, AppError>> {
    const where = { status: TemplateStatus.PUBLISHED };
    const itemsResult = await this.findMany({ where, skip: page * pageSize, take: pageSize });
    if (itemsResult.isErr()) return err(itemsResult.error);

    const countResult = await this.findMany({ where });
    if (countResult.isErr()) return err(countResult.error);

    return ok({
      templates: itemsResult.value,
      totalCount: countResult.value.length,
      page,
      pageSize,
    });
  }

  async updateStatus(id: string, status: TemplateStatus): Promise<Result<Template, AppError>> {
    return this.update(id, { status });
  }

  async softDelete(id: string, deletedBy: string): Promise<Result<void, AppError>> {
    const result = await this.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async incrementUsageCount(id: string): Promise<Result<void, AppError>> {
    const findResult = await this.findById(id);
    if (findResult.isErr()) return err(findResult.error);

    const current = findResult.value;
    const result = await this.update(id, { usageCount: current.usageCount + 1 });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateRatingStats(
    id: string,
    ratingAvg: number,
    ratingCount: number,
  ): Promise<Result<void, AppError>> {
    const result = await this.update(id, { ratingAvg, ratingCount });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async search(params: TemplateSearchParams): Promise<Result<TemplateSearchResult, AppError>> {
    const { filters, page, pageSize } = params;
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where['status'] = filters.status;
    } else {
      where['status'] = TemplateStatus.PUBLISHED;
    }

    if (filters.categoryId) {
      where['categoryId'] = filters.categoryId;
    }

    if (filters.authorId) {
      where['authorId'] = filters.authorId;
    }

    const itemsResult = await this.findMany({ where, skip: page * pageSize, take: pageSize });
    if (itemsResult.isErr()) return err(itemsResult.error);

    const countResult = await this.findMany({ where });
    if (countResult.isErr()) return err(countResult.error);

    return ok({
      templates: itemsResult.value,
      totalCount: countResult.value.length,
      page,
      pageSize,
    });
  }
}
