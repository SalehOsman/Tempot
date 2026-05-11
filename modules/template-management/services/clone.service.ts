import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { Template } from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { SubscriptionRepository } from '../repositories/subscription.repository.js';
import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export class CloneService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly eventBus: ModuleEventBus,
  ) {}

  async clone(templateId: string, userId: string): Promise<Result<Template, AppError>> {
    const sourceResult = await this.templateRepository.findById(templateId);
    if (sourceResult.isErr()) return err(sourceResult.error);

    const source = sourceResult.value;
    if (source.status !== TemplateStatus.PUBLISHED) {
      return err(new AppError('template-management.clone_only_published'));
    }

    const slug = `${source.slug}-clone-${Date.now().toString(36).slice(-4)}`;

    const cloneResult = await this.templateRepository.create({
      name: source.name,
      description: source.description,
      slug,
      status: TemplateStatus.DRAFT,
      content: source.content as unknown as Record<string, unknown>,
      categoryId: source.categoryId,
      authorId: userId,
      clonedFrom: templateId,
      language: source.language,
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });

    if (cloneResult.isErr()) return err(cloneResult.error);

    await this.templateRepository.incrementUsageCount(templateId);
    await this.subscriptionRepository.subscribe(templateId, userId);

    await this.eventBus.publish(TEMPLATE_EVENTS.CLONED, {
      sourceTemplateId: templateId,
      cloneTemplateId: cloneResult.value.id,
      userId,
      timestamp: new Date(),
    });

    return ok(cloneResult.value);
  }
}
