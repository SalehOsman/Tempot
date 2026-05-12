import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { TemplateSubscription } from '../types/category.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export class SubscriptionRepository extends ModuleBaseRepository<TemplateSubscription> {
  protected moduleName = 'template-management';
  protected entityName = 'templateSubscription';

  protected get model() {
    return (this.db as Record<string, unknown>)['templateSubscription'] as object;
  }

  async subscribe(
    templateId: string,
    userId: string,
  ): Promise<Result<TemplateSubscription, AppError>> {
    const existing = await this.findByUserAndTemplate(userId, templateId);
    if (existing.isErr()) return err(existing.error);
    if (existing.value) return ok(existing.value);

    return this.create({ templateId, userId });
  }

  async unsubscribe(templateId: string, userId: string): Promise<Result<void, AppError>> {
    const existing = await this.findByUserAndTemplate(userId, templateId);
    if (existing.isErr()) return err(existing.error);
    if (!existing.value) return ok(undefined);

    return this.delete(existing.value.id);
  }

  async findByUserAndTemplate(
    userId: string,
    templateId: string,
  ): Promise<Result<TemplateSubscription | null, AppError>> {
    const result = await this.findMany({ userId, templateId });
    if (result.isErr()) return err(result.error);
    return ok(result.value[0] ?? null);
  }

  async findByTemplate(templateId: string): Promise<Result<TemplateSubscription[], AppError>> {
    return this.findMany({ templateId });
  }

  async findByUser(userId: string): Promise<Result<TemplateSubscription[], AppError>> {
    return this.findMany({ userId });
  }

  async isSubscribed(templateId: string, userId: string): Promise<Result<boolean, AppError>> {
    const result = await this.findByUserAndTemplate(userId, templateId);
    if (result.isErr()) return err(result.error);
    return ok(result.value !== null);
  }
}
