import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { MIN_RATING_STARS, MAX_RATING_STARS } from '../types/category.types.js';
import type { TemplateRating } from '../types/category.types.js';
import type { RatingRepository, RatingStats } from '../repositories/rating.repository.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: ModuleEventBus,
  ) {}

  async rate(
    templateId: string,
    userId: string,
    stars: number,
  ): Promise<Result<TemplateRating, AppError>> {
    if (stars < MIN_RATING_STARS || stars > MAX_RATING_STARS) {
      return err(
        new AppError('template-management.invalid_rating', {
          min: MIN_RATING_STARS,
          max: MAX_RATING_STARS,
        }),
      );
    }

    const ratingResult = await this.ratingRepository.upsert(templateId, userId, stars);
    if (ratingResult.isErr()) return err(ratingResult.error);

    const statsResult = await this.recalculate(templateId);
    if (statsResult.isErr()) return err(statsResult.error);

    await this.eventBus.publish(TEMPLATE_EVENTS.RATED, {
      templateId,
      userId,
      stars,
      newAverage: statsResult.value.average,
      timestamp: new Date(),
    });

    return ok(ratingResult.value);
  }

  async getStats(templateId: string): Promise<Result<RatingStats, AppError>> {
    return this.ratingRepository.calculateStats(templateId);
  }

  async getUserRating(
    templateId: string,
    userId: string,
  ): Promise<Result<TemplateRating | null, AppError>> {
    return this.ratingRepository.findByUserAndTemplate(userId, templateId);
  }

  private async recalculate(templateId: string): Promise<Result<RatingStats, AppError>> {
    const statsResult = await this.ratingRepository.calculateStats(templateId);
    if (statsResult.isErr()) return err(statsResult.error);

    const stats = statsResult.value;
    await this.templateRepository.updateRatingStats(templateId, stats.average, stats.count);
    return ok(stats);
  }
}
