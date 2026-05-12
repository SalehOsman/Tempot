import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { ManagedBot } from '../types/bot.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface BotListResult {
  bots: ManagedBot[];
  totalCount: number;
}

export class BotRepository extends ModuleBaseRepository<ManagedBot> {
  protected moduleName = 'bot-management';
  protected entityName = 'managedBot';
  protected override hasSoftDelete = true;

  protected get model() {
    return (this.db as unknown as Record<string, object>)['managedBot'];
  }

  async findByTelegramUsername(username: string): Promise<Result<ManagedBot, AppError>> {
    const result = await this.findMany({ telegramUsername: username, isDeleted: false });
    if (result.isErr()) return err(result.error);
    const bot = result.value[0];
    return bot ? ok(bot) : err(new AppError('bot-management.not_found', { username }));
  }

  async list(page: number = 0, pageSize: number = 5): Promise<Result<BotListResult, AppError>> {
    const where = { isDeleted: false };
    const items = await this.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });
    if (items.isErr()) return err(items.error);

    const all = await this.findMany({ where });
    if (all.isErr()) return err(all.error);

    return ok({ bots: items.value, totalCount: all.value.length });
  }

  async archive(id: string, actorId: string): Promise<Result<ManagedBot, AppError>> {
    return this.update(id, {
      status: 'ARCHIVED',
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actorId,
    });
  }
}
