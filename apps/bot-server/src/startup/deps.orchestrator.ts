import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  AuditLogRepository,
  BootstrapSessionRepository,
  InteractionEventRepository,
  prisma,
  type ProtectedDataService,
} from '@tempot/database';
import { bootstrapSuperAdmins } from './bootstrap.js';
import { warmCaches } from './cache-warmer.js';
import { loadModuleHandlers } from './module-loader.js';

import { buildBotFactory } from './deps.bot-factory.js';
import { buildHttpServerFactory } from './deps.server-factory.js';
import { buildLifecycleFactory } from './deps.lifecycle.js';
import { AbilityRegistry } from '../authorization/ability-registry.js';
import { AbilityFactory, RoleEnum, type SessionUser } from '@tempot/auth-core';
import type { OrchestratorDeps } from './orchestrator.js';
import type {
  AuthorizationContextResolver,
  AuditLogProviderRecord,
  InteractionEventProviderRecord,
} from '../bot-server.types.js';

import type { ShutdownManager, CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { SessionProvider } from '@tempot/session-manager';
import type { SettingsService } from '@tempot/settings';
import type { ModuleRegistry } from '@tempot/module-registry';
import type { SentryReporter } from '@tempot/sentry';
import { buildSettingsProvider } from './deps.settings-provider.js';

export interface AssembleDepsOptions {
  loadConfig: typeof import('./config.loader.js').loadConfig;
  log: typeof import('@tempot/logger').logger;
  shutdownManager: ShutdownManager;
  eventBus: EventBusOrchestrator;
  cache: CacheService;
  sessionProvider: SessionProvider;
  settingsService: SettingsService;
  protectedDataService: ProtectedDataService | undefined;
  registry: ModuleRegistry;
  sentryReporter: SentryReporter | undefined;
  loadModuleLocales: typeof import('@tempot/i18n-core').loadModuleLocales;
  t: typeof import('@tempot/i18n-core').t;
}

function buildModuleHandlersDep(
  opts: AssembleDepsOptions,
  abilityRegistry: AbilityRegistry,
): OrchestratorDeps['loadModuleHandlers'] {
  const auditLogRepository = new AuditLogRepository();
  const interactionEventRepository = new InteractionEventRepository();
  return (bot, validated) =>
    loadModuleHandlers(bot as import('grammy').Bot<import('grammy').Context>, validated, {
      logger: opts.log,
      eventBus: {
        publish: async (event: string, payload: unknown) => {
          await opts.eventBus.publish(event, payload);
          return { isOk: () => true };
        },
      },
      sessionProvider: {
        getSession: async (userId: string, chatId: string) => {
          const result = await opts.sessionProvider.getSession(userId, chatId);
          return result.isOk() ? result.value : null;
        },
      },
      i18n: { t: (key: string, options?: Record<string, unknown>) => opts.t(key, options) },
      settings: buildSettingsProvider(opts.settingsService),
      protectedData: opts.protectedDataService,
      auditLog: {
        findMany: async (args: Record<string, unknown>) => {
          const result = await auditLogRepository.findMany(args);
          if (result.isErr()) throw result.error;
          return result.value as AuditLogProviderRecord[];
        },
      },
      interactionEvents: {
        findMany: async (args: Record<string, unknown>) => {
          const result = await interactionEventRepository.findMany(args);
          if (result.isErr()) throw result.error;
          return result.value as InteractionEventProviderRecord[];
        },
      },
      resolveAuthorizationContext: buildAuthorizationContextResolver(opts, abilityRegistry),
      abilityRegistry,
      importer: async (p: string) => {
        const { pathToFileURL } = await import('node:url');
        const entryPoint = pathToFileURL(`${p}/dist/index.js`).href;
        return import(entryPoint) as Promise<{
          default?: import('../bot-server.types.js').ModuleSetupFn;
          abilityDefinition?: import('@tempot/auth-core').AbilityDefinition;
        }>;
      },
    });
}

function buildAuthorizationContextResolver(
  opts: AssembleDepsOptions,
  abilityRegistry: AbilityRegistry,
): AuthorizationContextResolver {
  return async (ctx) => {
    const telegramId = ctx.from?.id;
    if (telegramId === undefined) return null;
    const chatId = ctx.chat?.id ?? telegramId;
    const result = await opts.sessionProvider.getSession(String(telegramId), String(chatId));
    const actor = resolveCurrentActor(result, telegramId);
    const ability = AbilityFactory.build(actor, abilityRegistry.getRuntimeDefinitions());
    if (ability.isErr()) throw ability.error;
    return { actor, ability: ability.value };
  };
}

function resolveCurrentActor(
  result: Awaited<ReturnType<SessionProvider['getSession']>>,
  telegramId: number,
): SessionUser {
  if (result.isErr()) {
    if (result.error.code !== 'session-manager.not_found') throw result.error;
    return { id: String(telegramId), role: RoleEnum.GUEST, status: 'UNRESOLVED' };
  }
  return {
    id: result.value.userId,
    role: result.value.role,
    status: result.value.status,
  };
}

function buildBasicDeps(opts: AssembleDepsOptions): Partial<OrchestratorDeps> {
  return {
    loadConfig: opts.loadConfig,
    connectDatabase: async () => {
      try {
        await prisma.$connect();
        return ok(undefined);
      } catch (error: unknown) {
        return err(
          new AppError('bot-server.startup.database_unreachable', { error: String(error) }),
        );
      }
    },
    bootstrapSuperAdmins: (ids: number[]) =>
      bootstrapSuperAdmins(ids, {
        sessions: new BootstrapSessionRepository(),
        logger: opts.log,
      }),
    warmCaches: () =>
      warmCaches({
        settingsWarmer: {
          warmAll: async () => {
            const result = await opts.settingsService.getDynamic('maintenance_mode');
            if (result.isErr()) throw result.error;
          },
        },
        i18nWarmer: {
          warmAll: async () => {
            const result = await opts.loadModuleLocales();
            if (result.isErr()) throw result.error;
          },
        },
        logger: opts.log,
      }),
    discover: () => opts.registry.discover(),
    validate: () => opts.registry.validate(),
    registerCommands: (bot) =>
      opts.registry.register(bot as unknown as import('@tempot/module-registry').RegistryBot),
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await opts.eventBus.publish(event, payload);
      },
    },
    logger: opts.log,
  };
}

export function assembleOrchestratorDeps(opts: AssembleDepsOptions): OrchestratorDeps {
  const abilityRegistry = new AbilityRegistry();
  const lifecycle = buildLifecycleFactory({
    shutdownManager: opts.shutdownManager,
    cache: opts.cache,
    prismaClient: prisma,
    eventBus: opts.eventBus,
    log: opts.log,
  });

  return {
    ...(buildBasicDeps(opts) as OrchestratorDeps),
    loadModuleHandlers: buildModuleHandlersDep(opts, abilityRegistry),
    createBot: buildBotFactory(opts, abilityRegistry),
    createHttpServer: buildHttpServerFactory(opts),
    registerShutdownHooks: lifecycle.registerShutdownHooks,
    setupSignalHandlers: lifecycle.setupSignalHandlers,
  };
}
