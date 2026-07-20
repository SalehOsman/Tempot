import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ProtectedDataService } from '@tempot/database';
import { registerDeps } from './deps.context.js';
import { initUserService } from './services/user-service.context.js';
import { UserRepository } from './repositories/user.repository.js';
import { MembershipApprovalProfileService } from './services/membership-approval-profile.service.js';
import { startCommand } from './commands/start.command.js';
import { profileCommand } from './commands/profile.command.js';
import { usersCommand } from './commands/users.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { handleTextInput } from './handlers/text.handler.js';
import { createMembershipApprovalHandler } from './events/membership-approval.handler.js';

export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
  subscribe: (
    event: string,
    handler: (payload: unknown) => void,
  ) => Promise<{ isOk: () => boolean }>;
}

export interface ModuleSessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
  saveSession?: (session: {
    userId: string;
    chatId: string;
    role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    status: 'ACTIVE' | 'BANNED' | 'PENDING';
    language: string;
    activeConversation: string | null;
    metadata: Record<string, unknown> | null;
    schemaVersion: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }) => Promise<unknown>;
}

export interface ModuleI18n {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface ModuleSettings {
  get: (key: string) => Promise<unknown>;
}

export interface ModuleNavigationProvider {
  getMainMenuItems: (role: UserRole) => readonly ModuleNavigationItem[];
  getVisibleMainMenuItems?: (actor: {
    role: UserRole;
    abilities: readonly string[];
  }) => readonly ModuleNavigationItem[];
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
  await registerMembershipApprovalHandler(deps);

  deps.logger.info({
    msg: 'user-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

async function registerMembershipApprovalHandler(deps: ModuleDeps): Promise<void> {
  const repository = new UserRepository(
    {
      log: async (data: Record<string, unknown>) => {
        deps.logger.info({ msg: 'user-management.audit', ...data });
      },
    },
    undefined,
    deps.protectedData,
  );
  const service = new MembershipApprovalProfileService(repository, {
    log: async (data: Record<string, unknown>) => {
      deps.logger.info({ msg: 'user-management.audit', ...data });
    },
  });
  const result = await deps.eventBus.subscribe(
    'membership-management.request.approved',
    createMembershipApprovalHandler(service, deps.logger, deps.sessionProvider),
  );
  if (!result.isOk()) {
    deps.logger.warn({ msg: 'membership_approval_subscription_failed' });
  }
}

export default setup;
export { userManagementAbilities, abilityDefinition } from './abilities.js';
