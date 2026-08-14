import type { Bot, Context, MiddlewareFn } from 'grammy';
import { createConversation } from '@grammyjs/conversations';
import type { ModuleConfig } from '@tempot/module-registry';
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

export interface ModuleAuthorizationPolicy {
  module: string;
  classification: 'public' | 'bootstrap' | 'protected';
  action: string;
  subject: string;
}

export interface ModuleAuthorizationProvider {
  guard: (policy: ModuleAuthorizationPolicy) => MiddlewareFn<Context>;
  enforce: (ctx: Context, policy: ModuleAuthorizationPolicy) => Promise<boolean>;
  refreshAndEnforce: (ctx: Context, policy: ModuleAuthorizationPolicy) => Promise<boolean>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: ModuleSessionProvider;
  i18n: ModuleI18n;
  settings: ModuleSettings;
  authorization: ModuleAuthorizationProvider;
  config: ModuleConfig;
}

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  initBotService();
  initLifecycleService();

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
  bot.command(
    'bots',
    deps.authorization.guard({
      module: 'bot-management',
      classification: 'protected',
      action: 'read',
      subject: 'bot',
    }),
    botsCommand,
  );
  bot.command(
    'new_bot',
    deps.authorization.guard({
      module: 'bot-management',
      classification: 'protected',
      action: 'create',
      subject: 'bot',
    }),
    newBotCommand,
  );
  bot.on('callback_query:data', handleCallbackQuery);

  deps.logger.info({
    msg: 'bot-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
export { botManagementAbilities, abilityDefinition } from './abilities.js';
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
