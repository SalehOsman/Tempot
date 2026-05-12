import type { Bot, Context } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { botManagementAbilities } from './abilities.js';

export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  config: ModuleConfig;
}

const setup = async (_bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  deps.logger.info({
    msg: 'bot-management foundation registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
export { botManagementAbilities };
export { canDoBotManagement } from './abilities.js';
export * from './types/index.js';
export { BOT_MANAGEMENT_EVENTS } from './events/event-names.js';
export type { BotManagementEventName } from './events/event-names.js';
export type {
  BotRegisteredEvent,
  BotUpdatedEvent,
  BotLifecycleChangedEvent,
  BotSettingsChangedEvent,
  BotModuleEnablementChangedEvent,
  BotProvisioningCompletedEvent,
  BotHealthChangedEvent,
  BotExportCompletedEvent,
  BotImportCompletedEvent,
} from './events/event-payloads.js';
