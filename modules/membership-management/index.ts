import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';
import { AppError, err, ok } from '@tempot/shared';
import { PrismaMembershipRequestRepository } from './repositories/membership-request.repository.js';
import { MembershipRequestService } from './services/membership-request.service.js';
import { createMembershipAdminNotifier } from './services/membership-admin-notifier.js';
import { MembershipRequestDraftStore } from './services/membership-request-draft.store.js';
import { registerDeps } from './deps.context.js';
import { requestMembershipCommand } from './commands/request-membership.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { handleMembershipText } from './handlers/membership-request-flow.handler.js';

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
  const repository = new PrismaMembershipRequestRepository({
    log: async (data: Record<string, unknown>) => {
      deps.logger.info({ msg: 'membership-management.audit', ...data });
    },
  });
  const membershipRequests = new MembershipRequestService({
    repository,
    eventBus: {
      publish: async (eventName, payload) => {
        const published = await deps.eventBus.publish(eventName, payload);
        return published.isOk()
          ? ok(undefined)
          : err(new AppError('membership-management.event_publish_failed', { eventName }));
      },
    },
  });
  const adminNotifier = createMembershipAdminNotifier({
    api: bot.api,
    logger: deps.logger,
    superAdminIds: readSuperAdminIds(),
    t: deps.i18n.t,
  });

  registerDeps({
    adminNotifier,
    authorization: deps.authorization,
    i18n: deps.i18n,
    membershipRequests,
    requestDrafts: new MembershipRequestDraftStore(),
  });

  bot.command(
    'join',
    deps.authorization.guard({
      module: 'membership-management',
      classification: 'bootstrap',
      action: 'create',
      subject: 'membership-request',
    }),
    requestMembershipCommand,
  );
  bot.on('callback_query:data', handleCallbackQuery);
  bot.on('message:text', handleMembershipText);
  deps.logger.info({
    msg: 'membership-management handlers registered',
    commandCount: deps.config.commands.length,
  });
};

function readSuperAdminIds(): number[] {
  const raw = process.env['SUPER_ADMIN_IDS'];
  if (raw === undefined || raw.trim() === '') return [];
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));
}

export default setup;
export { membershipAbilityDefinition as abilityDefinition } from './abilities.js';
export * from './events/event-names.js';
export type * from './events/event-payloads.js';
export { handleCallbackQuery } from './handlers/callback.handler.js';
export { PrismaMembershipRequestRepository } from './repositories/membership-request.repository.js';
export type { MembershipRequestRepository } from './repositories/membership-request.repository.types.js';
export { MembershipRequestService } from './services/membership-request.service.js';
export type {
  MembershipRequest,
  MembershipRequestStatus,
  SubmitMembershipRequestInput,
} from './types/membership-request.types.js';
