import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ProtectedDataService } from '@tempot/database';
import { registerDeps } from './deps.context.js';
import { initUserService } from './services/user-service.context.js';
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

export interface ModuleNavigationProvider {
  getMainMenuItems: (role: UserRole) => readonly ModuleNavigationItem[];
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
  protectedData?: ProtectedDataService;
  navigation?: ModuleNavigationProvider;
  authorization: ModuleAuthorizationProvider;
  config: ModuleConfig;
}

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  initUserService();

  bot.command(
    'start',
    deps.authorization.guard({
      module: 'user-management',
      classification: 'bootstrap',
      action: 'read',
      subject: 'bootstrap',
    }),
    startCommand,
  );
  bot.command(
    'profile',
    deps.authorization.guard({
      module: 'user-management',
      classification: 'protected',
      action: 'read',
      subject: 'profile',
    }),
    profileCommand,
  );
  bot.command(
    'users',
    deps.authorization.guard({
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    }),
    usersCommand,
  );
  bot.on('callback_query:data', handleCallbackQuery);
  bot.on('message:text', handleTextInput);

  deps.logger.info({
    msg: 'user-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
export { userManagementAbilities, abilityDefinition } from './abilities.js';
