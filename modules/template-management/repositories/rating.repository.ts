import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { TemplateRating } from '../types/category.types.js';

export interface RatingStats {
  average: number;
  count: number;
}

export class RatingRepository extends BaseRepository<TemplateRating> {
  protected moduleName = 'template-management';
  protected entityName = 'templateRating';

  protected get model() {
    return (this.db as Record<string, unknown>)['templateRating'] as object;
  }

  async findByUserAndTemplate(
    userId: string,
    templateId: string,
  ): Promise<Result<TemplateRating | null, AppError>> {
    const result = await this.findMany({ userId, templateId });
    if (result.isErr()) return err(result.error);
    return ok(result.value[0] ?? null);
  }

  async upsert(
    templateId: string,
    userId: string,
    stars: number,
  ): Promise<Result<TemplateRating, AppError>> {
    const existing = await this.findByUserAndTemplate(userId, templateId);
    if (existing.isErr()) return err(existing.error);

    if (existing.value) {
      return this.update(existing.value.id, { stars });
    }

    return this.create({ templateId, userId, stars });
  }

  async calculateStats(templateId: string): Promise<Result<RatingStats, AppError>> {
    const result = await this.findMany({ templateId });
    if (result.isErr()) return err(result.error);

    const ratings = result.value;
    if (ratings.length === 0) {
      return ok({ average: 0, count: 0 });
    }

    const sum = ratings.reduce((acc, r) => acc + r.stars, 0);
    const average = Math.round((sum / ratings.length) * 100) / 100;
    return ok({ average, count: ratings.length });
  }
}
