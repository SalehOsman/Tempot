import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { BotHealthStatus } from '../types/bot.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface BotHealthSnapshot {
  id: string;
  botId: string;
  status: BotHealthStatus;
  summaryKey: string;
  details: Record<string, unknown> | null;
  observedAt: Date;
}

export interface RecordHealthSnapshotInput {
  botId: string;
  status: BotHealthStatus;
  summaryKey: string;
  details?: Record<string, unknown>;
}

export class HealthSnapshotRepository extends ModuleBaseRepository<BotHealthSnapshot> {
  protected moduleName = 'bot-management';
  protected entityName = 'botHealthSnapshot';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botHealthSnapshot'];
  }

  async record(input: RecordHealthSnapshotInput): Promise<Result<BotHealthSnapshot, AppError>> {
    return this.create({
      id: `health-${crypto.randomUUID()}`,
      ...input,
      details: input.details ?? null,
      observedAt: new Date(),
    });
  }

  async latestForBot(botId: string): Promise<Result<BotHealthSnapshot, AppError>> {
    const result = await this.findMany({ botId });
    if (result.isErr()) return err(result.error);
    const latest = [...result.value].sort(
      (a, b) => b.observedAt.getTime() - a.observedAt.getTime(),
    )[0];
    return latest ? ok(latest) : err(new AppError('bot-management.health_not_found'));
  }
}
