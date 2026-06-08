import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { messagesCommand } from './commands/messages.command.js';
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
  sessionProvider: { getSession: (userId: string, chatId: string) => Promise<unknown> };
  i18n: { t: (key: string, options?: Record<string, unknown>) => string };
  settings: { get: (key: string) => Promise<unknown> };
  authorization: ModuleAuthorizationProvider;
  config: ModuleConfig;
}

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  bot.command(
    'messages',
    deps.authorization.guard({
      module: 'content-management',
      classification: 'protected',
      action: 'read',
      subject: 'content',
    }),
    messagesCommand,
  );
  bot.on('callback_query:data', handleCallbackQuery);
  deps.logger.info({ msg: 'content-management handlers registered' });
};

export default setup;
export { contentManagementAbilities, abilityDefinition } from './abilities.js';
