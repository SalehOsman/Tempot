import type { Bot, Context } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { initUserService } from './services/user-service.context.js';
import { userManagementAbilities } from './abilities.js';
import { startCommand } from './commands/start.command.js';
import { profileCommand } from './commands/profile.command.js';
import { usersCommand } from './commands/users.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { handleTextInput } from './handlers/text.handler.js';

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
  // ✅ يجب أن يكون أول شيء — يُهيئ deps.context لكل أجزاء الموديول
  registerDeps(deps);

  // ✅ تهيئة UserService (يعتمد على getLogger من deps.context)
  initUserService();

  bot.command('start', startCommand);
  bot.command('profile', profileCommand);
  bot.command('users', usersCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  bot.on('message:text', handleTextInput);

  deps.logger.info({
    msg: 'user-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
export { userManagementAbilities };
