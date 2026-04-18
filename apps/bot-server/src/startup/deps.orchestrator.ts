import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma } from '@tempot/database';
import { bootstrapSuperAdmins } from './bootstrap.js';
import { warmCaches } from './cache-warmer.js';
import { loadModuleHandlers } from './module-loader.js';

import { buildBotFactory } from './deps.bot-factory.js';
import { buildHttpServerFactory } from './deps.server-factory.js';
import { buildLifecycleFactory } from './deps.lifecycle.js';
import type { OrchestratorDeps } from './orchestrator.js';

import type { ShutdownManager, CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { SessionProvider } from '@tempot/session-manager';
import type { SettingsService } from '@tempot/settings';
import type { ModuleRegistry } from '@tempot/module-registry';
import type { SentryReporter } from '@tempot/sentry';

export interface AssembleDepsOptions {
  loadConfig: typeof import('./config.loader.js').loadConfig;
  log: typeof import('@tempot/logger').logger;
  shutdownManager: ShutdownManager;
  eventBus: EventBusOrchestrator;
  cache: CacheService;
  sessionProvider: SessionProvider;
  settingsService: SettingsService;
  registry: ModuleRegistry;
  sentryReporter: SentryReporter | undefined;
  loadModuleLocales: typeof import('@tempot/i18n-core').loadModuleLocales;
  t: typeof import('@tempot/i18n-core').t;
}

function buildModuleHandlersDep(opts: AssembleDepsOptions): OrchestratorDeps['loadModuleHandlers'] {
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
      i18n: { t: (key: string) => opts.t(key) },
      settings: {
        get: async (key: string) => {
          const result = await opts.settingsService.getDynamic(key as never);
          return result.isOk() ? result.value : null;
        },
      },
      importer: async (p: string) =>
        import(p) as Promise<{ default?: import('../bot-server.types.js').ModuleSetupFn }>,
    });
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
      bootstrapSuperAdmins(ids, { prisma, logger: opts.log }),
    warmCaches: () =>
      warmCaches({
        settingsWarmer: {
          warmAll: async () => {
            await opts.settingsService.getDynamic('maintenance_mode');
          },
        },
        i18nWarmer: {
          warmAll: async () => {
            await opts.loadModuleLocales();
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
  const lifecycle = buildLifecycleFactory({
    shutdownManager: opts.shutdownManager,
    cache: opts.cache,
    prismaClient: prisma,
    eventBus: opts.eventBus,
    log: opts.log,
  });

  return {
    ...(buildBasicDeps(opts) as OrchestratorDeps),
    loadModuleHandlers: buildModuleHandlersDep(opts),
    createBot: buildBotFactory(opts),
    createHttpServer: buildHttpServerFactory(opts),
    registerShutdownHooks: lifecycle.registerShutdownHooks,
    setupSignalHandlers: lifecycle.setupSignalHandlers,
  };
}
