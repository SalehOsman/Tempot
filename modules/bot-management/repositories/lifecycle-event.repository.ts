import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { BotLifecycleEvent, BotLifecycleStatus } from '../types/lifecycle.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface AppendLifecycleEventInput {
  botId: string;
  fromStatus: BotLifecycleStatus | null;
  toStatus: BotLifecycleStatus;
  actorId: string;
  reason: string | null;
}

export class LifecycleEventRepository extends ModuleBaseRepository<BotLifecycleEvent> {
  protected moduleName = 'bot-management';
  protected entityName = 'botLifecycleEvent';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botLifecycleEvent'];
  }

  async append(input: AppendLifecycleEventInput): Promise<Result<BotLifecycleEvent, AppError>> {
    return this.create({
      id: `lifecycle-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date(),
    });
  }

  async listByBotId(botId: string): Promise<Result<BotLifecycleEvent[], AppError>> {
    return this.findMany({ botId });
  }
}
