import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import {
  BotModuleEnablementState,
  type BotModuleEnablement,
} from '../types/module-enablement.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../events/event-names.js';

export interface SetModuleStateInput {
  botId: string;
  moduleName: string;
  state: BotModuleEnablementState;
  actorId: string;
  blockedReason?: string;
}

export interface ModuleRegistryMetadata {
  name: string;
  config: {
    isActive: boolean;
    requires: {
      packages: string[];
    };
  };
}

export interface ModuleRegistryMetadataPort {
  getModule: (name: string) => ModuleRegistryMetadata | undefined;
  isPackageAvailable?: (name: string) => boolean;
}

export interface ModuleEnablementRepositoryPort {
  listByBotId: (botId: string) => Promise<Result<BotModuleEnablement[], AppError>>;
  setState: (input: {
    botId: string;
    moduleName: string;
    state: BotModuleEnablementState;
    blockedReason?: string;
    enabledBy?: string;
  }) => Promise<Result<BotModuleEnablement, AppError>>;
}

export interface ModuleEnablementEventBusPort {
  publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export class ModuleEnablementService {
  constructor(
    private readonly repository: ModuleEnablementRepositoryPort,
    private readonly eventBus: ModuleEnablementEventBusPort,
    private readonly moduleRegistry: ModuleRegistryMetadataPort,
  ) {}

  async list(botId: string): Promise<Result<BotModuleEnablement[], AppError>> {
    return this.repository.listByBotId(botId);
  }

  async enable(
    botId: string,
    moduleName: string,
    actorId: string,
  ): Promise<Result<BotModuleEnablement, AppError>> {
    return this.setState({
      botId,
      moduleName,
      actorId,
      state: BotModuleEnablementState.ENABLED,
    });
  }

  async disable(
    botId: string,
    moduleName: string,
    actorId: string,
  ): Promise<Result<BotModuleEnablement, AppError>> {
    return this.setState({
      botId,
      moduleName,
      actorId,
      state: BotModuleEnablementState.DISABLED,
    });
  }

  async setState(input: SetModuleStateInput): Promise<Result<BotModuleEnablement, AppError>> {
    const validation = this.validate(input);
    if (validation.isErr()) return err(validation.error);

    const resolved = this.resolveState(input);
    const result = await this.repository.setState({
      botId: resolved.botId,
      moduleName: resolved.moduleName,
      state: resolved.state,
      blockedReason: resolved.blockedReason,
      enabledBy: resolved.state === BotModuleEnablementState.ENABLED ? resolved.actorId : undefined,
    });
    if (result.isErr()) return err(result.error);

    const published = await this.publishChange(resolved);
    return published.isErr() ? err(published.error) : ok(result.value);
  }

  private validate(input: SetModuleStateInput): Result<void, AppError> {
    if (input.state === BotModuleEnablementState.BLOCKED && !input.blockedReason?.trim()) {
      return err(new AppError('bot-management.blocked_reason_required'));
    }
    return ok(undefined);
  }

  private resolveState(input: SetModuleStateInput): SetModuleStateInput {
    if (input.state !== BotModuleEnablementState.ENABLED) return input;

    const module = this.moduleRegistry.getModule(input.moduleName);
    if (!module || !module.config.isActive) {
      return {
        ...input,
        state: BotModuleEnablementState.UNAVAILABLE,
        blockedReason: 'bot-management.module_unavailable',
      };
    }

    const missingPackages = module.config.requires.packages.filter(
      (packageName) => !this.isPackageAvailable(packageName),
    );
    if (missingPackages.length > 0) {
      return {
        ...input,
        state: BotModuleEnablementState.BLOCKED,
        blockedReason: 'bot-management.module_requirements_missing',
      };
    }

    return input;
  }

  private isPackageAvailable(packageName: string): boolean {
    return this.moduleRegistry.isPackageAvailable?.(packageName) ?? true;
  }

  private async publishChange(input: SetModuleStateInput): Promise<Result<void, AppError>> {
    const result = await this.eventBus.publish(BOT_MANAGEMENT_EVENTS.MODULE_ENABLEMENT_CHANGED, {
      botId: input.botId,
      moduleName: input.moduleName,
      state: input.state,
      actorId: input.actorId,
      blockedReason: input.blockedReason ?? null,
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
