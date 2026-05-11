import { AppError } from '@tempot/shared';
import { type Result } from 'neverthrow';
import type { TemplateSubscription } from '../types/category.types.js';
import type { SubscriptionRepository } from '../repositories/subscription.repository.js';

export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async subscribe(
    templateId: string,
    userId: string,
  ): Promise<Result<TemplateSubscription, AppError>> {
    return this.subscriptionRepository.subscribe(templateId, userId);
  }

  async unsubscribe(templateId: string, userId: string): Promise<Result<void, AppError>> {
    return this.subscriptionRepository.unsubscribe(templateId, userId);
  }

  async isSubscribed(templateId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.subscriptionRepository.isSubscribed(templateId, userId);
  }

  async getSubscribers(templateId: string): Promise<Result<TemplateSubscription[], AppError>> {
    return this.subscriptionRepository.findByTemplate(templateId);
  }

  async getUserSubscriptions(userId: string): Promise<Result<TemplateSubscription[], AppError>> {
    return this.subscriptionRepository.findByUser(userId);
  }
}
