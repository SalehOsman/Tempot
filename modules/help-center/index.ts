import type { Bot, Context } from 'grammy';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { helpCenterAbilities } from './abilities.js';
import { helpCommand } from './commands/help.command.js';
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

export interface ModuleNavigationProvider {
  getMainMenuItems: (role: UserRole) => readonly ModuleNavigationItem[];
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: { getSession: (userId: string, chatId: string) => Promise<unknown> };
  i18n: { t: (key: string, options?: Record<string, unknown>) => string };
  settings: { get: (key: string) => Promise<unknown> };
  navigation?: ModuleNavigationProvider;
  config: ModuleConfig;
}

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  bot.command('help', helpCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  deps.logger.info({ msg: 'help-center handlers registered' });
};

export default setup;
export { helpCenterAbilities };
