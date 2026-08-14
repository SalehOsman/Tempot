import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { ManagedBot } from '../types/bot.types.js';
import { BotLifecycleStatus, type BotLifecycleEvent } from '../types/lifecycle.types.js';
import { canTransition, requiresTransitionReason } from '../contracts/lifecycle-transitions.js';
import { BOT_MANAGEMENT_EVENTS } from '../events/event-names.js';

export interface LifecycleTransitionInput {
  botId: string;
  toStatus: BotLifecycleStatus;
  actorId: string;
  reason?: string;
}

export interface LifecycleBotRepositoryPort {
  findById: (id: string) => Promise<Result<ManagedBot, AppError>>;
  update: (id: string, data: Record<string, unknown>) => Promise<Result<ManagedBot, AppError>>;
}

export interface LifecycleEventRepositoryPort {
  append: (
    event: Omit<BotLifecycleEvent, 'id' | 'createdAt'>,
  ) => Promise<Result<BotLifecycleEvent, AppError>>;
}

export interface LifecycleEventBusPort {
  publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export class LifecycleService {
  constructor(
    private readonly botRepository: LifecycleBotRepositoryPort,
    private readonly lifecycleRepository: LifecycleEventRepositoryPort,
    private readonly eventBus: LifecycleEventBusPort,
  ) {}

  async transition(input: LifecycleTransitionInput): Promise<Result<ManagedBot, AppError>> {
    const existing = await this.botRepository.findById(input.botId);
    if (existing.isErr()) return err(existing.error);

    const fromStatus = existing.value.status;
    const validation = this.validateTransition(fromStatus, input);
    if (validation.isErr()) return err(validation.error);

    const updated = await this.botRepository.update(input.botId, this.createLifecycleUpdate(input));
    if (updated.isErr()) return err(updated.error);

    const history = await this.lifecycleRepository.append({
      botId: input.botId,
      fromStatus,
      toStatus: input.toStatus,
      actorId: input.actorId,
      reason: input.reason ?? null,
    });
    if (history.isErr()) return err(history.error);

    const published = await this.publishChange(input, fromStatus);
    return published.isErr() ? err(published.error) : ok(updated.value);
  }

  private validateTransition(
    fromStatus: BotLifecycleStatus,
    input: LifecycleTransitionInput,
  ): Result<void, AppError> {
    if (!canTransition(fromStatus, input.toStatus)) {
      return err(new AppError('bot-management.invalid_transition'));
    }
    if (requiresTransitionReason(fromStatus, input.toStatus) && !input.reason?.trim()) {
      return err(new AppError('bot-management.missing_reason'));
    }
    return ok(undefined);
  }

  private createLifecycleUpdate(input: LifecycleTransitionInput): Record<string, unknown> {
    if (input.toStatus !== BotLifecycleStatus.ARCHIVED) {
      return { status: input.toStatus };
    }

    return {
      status: input.toStatus,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: input.actorId,
    };
  }

  private async publishChange(
    input: LifecycleTransitionInput,
    fromStatus: BotLifecycleStatus,
  ): Promise<Result<void, AppError>> {
    const result = await this.eventBus.publish(BOT_MANAGEMENT_EVENTS.LIFECYCLE_CHANGED, {
      botId: input.botId,
      fromStatus,
      toStatus: input.toStatus,
      actorId: input.actorId,
      reason: input.reason ?? null,
      timestamp: new Date(),
    });
    if (this.isFailedPublish(result))
      return err(new AppError('bot-management.event_publish_failed'));
    return ok(undefined);
  }

  private isFailedPublish(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'isOk' in value
      ? !(value as { isOk: () => boolean }).isOk()
      : false;
  }
}
