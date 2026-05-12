import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import {
  BotModuleEnablementState,
  type BotModuleEnablement,
} from '../types/module-enablement.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface SetModuleEnablementInput {
  botId: string;
  moduleName: string;
  state: BotModuleEnablementState;
  blockedReason?: string;
  enabledBy?: string;
}

export class ModuleEnablementRepository extends ModuleBaseRepository<BotModuleEnablement> {
  protected moduleName = 'bot-management';
  protected entityName = 'botModuleEnablement';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botModuleEnablement'];
  }

  async listByBotId(botId: string): Promise<Result<BotModuleEnablement[], AppError>> {
    return this.findMany({ botId });
  }

  async findByBotAndModule(
    botId: string,
    moduleName: string,
  ): Promise<Result<BotModuleEnablement, AppError>> {
    const result = await this.findMany({ botId, moduleName });
    if (result.isErr()) return err(result.error);
    const enablement = result.value[0];
    return enablement ? ok(enablement) : err(new AppError('bot-management.module_not_found'));
  }

  async setState(input: SetModuleEnablementInput): Promise<Result<BotModuleEnablement, AppError>> {
    const existing = await this.findByBotAndModule(input.botId, input.moduleName);
    const data = this.toRecord(input);
    if (existing.isOk()) return this.update(existing.value.id, data);

    return this.create({
      id: `module-${crypto.randomUUID()}`,
      ...data,
      updatedAt: new Date(),
    });
  }

  private toRecord(input: SetModuleEnablementInput): Record<string, unknown> {
    return {
      botId: input.botId,
      moduleName: input.moduleName,
      state: input.state,
      blockedReason: input.blockedReason ?? null,
      enabledBy: input.enabledBy ?? null,
      enabledAt: input.state === BotModuleEnablementState.ENABLED ? new Date() : null,
    };
  }
}
