import type { Bot, Context, MiddlewareFn } from 'grammy';
import { createConversation } from '@grammyjs/conversations';
import type { ModuleConfig } from '@tempot/module-registry';
import { botManagementAbilities } from './abilities.js';
import { registerDeps } from './deps.context.js';
import { initBotService } from './services/bot-service.context.js';
import { initLifecycleService } from './services/lifecycle-service.context.js';
import { botsCommand } from './commands/bots.command.js';
import { BOT_REGISTRATION_FLOW_ID, newBotCommand } from './commands/new-bot.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { runBotRegistrationConversation } from './flows/bot-registration.flow.js';
import {
  BOT_LIFECYCLE_REASON_FLOW_ID,
  runLifecycleReasonConversation,
} from './flows/lifecycle-reason.flow.js';

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

export interface ModuleSessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

export interface ModuleI18n {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface ModuleSettings {
  get: (key: string) => Promise<unknown>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: ModuleSessionProvider;
  i18n: ModuleI18n;
  settings: ModuleSettings;
  config: ModuleConfig;
}

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  initBotService();
  initLifecycleService();

  bot.command('bots', botsCommand);
  bot.command('new_bot', newBotCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  bot.use(
    createConversation<Context, Context>(
      runBotRegistrationConversation,
      BOT_REGISTRATION_FLOW_ID,
    ) as unknown as MiddlewareFn<Context>,
  );
  bot.use(
    createConversation<Context, Context>(
      runLifecycleReasonConversation,
      BOT_LIFECYCLE_REASON_FLOW_ID,
    ) as unknown as MiddlewareFn<Context>,
  );

  deps.logger.info({
    msg: 'bot-management handlers registered',
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
