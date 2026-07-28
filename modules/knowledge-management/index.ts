import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { knowledgeCommand } from './commands/knowledge.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import type { KnowledgeOperationsProvider } from './contracts/knowledge-operations.types.js';

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
  classification: 'public' | 'bootstrap' | 'protected' | 'admin';
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
  i18n: { t: (key: string, options?: Record<string, unknown>) => string };
  authorization: ModuleAuthorizationProvider;
  knowledge?: KnowledgeOperationsProvider;
  config: ModuleConfig;
}

const knowledgePolicy: ModuleAuthorizationPolicy = {
  module: 'knowledge-management',
  classification: 'admin',
  action: 'manage',
  subject: 'knowledge',
};

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  bot.command('knowledge', deps.authorization.guard(knowledgePolicy), knowledgeCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  deps.logger.info({ msg: 'knowledge-management handlers registered' });
};

export default setup;
export { knowledgeManagementAbilities, abilityDefinition } from './abilities.js';
export type { KnowledgeOperationsProvider } from './contracts/knowledge-operations.types.js';
