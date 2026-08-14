import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { templatesCommand } from './commands/templates.command.js';
import { newTemplateCommand } from './commands/new-template.command.js';
import { importTemplateCommand } from './commands/import-template.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';

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

  bot.command(
    'templates',
    deps.authorization.guard({
      module: 'template-management',
      classification: 'public',
      action: 'read',
      subject: 'template',
    }),
    templatesCommand,
  );
  bot.command(
    'new_template',
    deps.authorization.guard({
      module: 'template-management',
      classification: 'protected',
      action: 'create',
      subject: 'template',
    }),
    newTemplateCommand,
  );
  bot.command(
    'import_template',
    deps.authorization.guard({
      module: 'template-management',
      classification: 'protected',
      action: 'manage',
      subject: 'template',
    }),
    importTemplateCommand,
  );
  bot.on('callback_query:data', handleCallbackQuery);

  deps.logger.info({
    msg: 'template-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
export { templateManagementAbilities, abilityDefinition } from './abilities.js';
export * from './types/index.js';
export { TEMPLATE_EVENTS } from './events/event-names.js';
export type { TemplateEventName } from './events/event-names.js';
export type {
  TemplateCreatedEvent,
  TemplateStatusChangedEvent,
  TemplateVersionPublishedEvent,
  TemplateDeletedEvent,
  TemplateClonedEvent,
  TemplateRatedEvent,
} from './events/event-payloads.js';
