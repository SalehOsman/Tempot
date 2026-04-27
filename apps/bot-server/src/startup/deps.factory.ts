import path from 'node:path';

import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';

import { logger } from '@tempot/logger';
import { ShutdownManager, AppError } from '@tempot/shared';
import { prisma } from '@tempot/database';

import {
  StaticSettingsLoader,
  SettingsRepository,
  DynamicSettingsService,
  MaintenanceService,
  SettingsService,
} from '@tempot/settings';
import { loadModuleLocales, t, initI18n } from '@tempot/i18n-core';
import { SentryReporter, initSentry } from '@tempot/sentry';

import {
  buildEventBus,
  buildCacheService,
  buildSessionProvider,
  buildModuleRegistry,
} from './deps.builders.js';
import { assembleOrchestratorDeps } from './deps.orchestrator.js';

import { loadConfig } from './config.loader.js';
import type { OrchestratorDeps } from './orchestrator.js';
import type { CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';

function buildShutdownManager(): ShutdownManager {
  return new ShutdownManager({
    info: (msg: string) => logger.info({ msg }),
    error: (data: Record<string, unknown>) => logger.error(data),
  });
}

function redisConfig(): { connectionString: string; host: string; port: number } {
  return {
    connectionString:
      process.env['REDIS_URL'] ??
      `redis://${process.env['REDIS_HOST'] ?? 'localhost'}:${process.env['REDIS_PORT'] ?? 6379}`,
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: Number(process.env['REDIS_PORT'] ?? 6379),
  };
}

function buildSettingsService(
  cache: CacheService,
  eventBus: EventBusOrchestrator,
): SettingsService {
  const staticResult = StaticSettingsLoader.load();
  const settingsRepo = new SettingsRepository(
    prisma as unknown as import('@tempot/settings').SettingsPrismaClient,
  );

  const dynSettings = new DynamicSettingsService({
    repository: settingsRepo,
    cache,
    eventBus: {
      publish: async (event: string, payload: unknown) => eventBus.publish(event, payload),
    },
    logger: {
      info: (data: Record<string, unknown>) => logger.info(data),
      warn: (data: Record<string, unknown>) => logger.warn(data),
      error: (data: Record<string, unknown>) => logger.error(data),
      debug: (data: Record<string, unknown>) => logger.debug(data),
    },
  });

  const staticSettings = staticResult.isOk()
    ? staticResult.value
    : {
        botToken: '',
        databaseUrl: '',
        superAdminIds: [],
        defaultLanguage: 'en',
        defaultCountry: 'US',
      };

  const maintenance = new MaintenanceService(dynSettings, staticSettings);
  return new SettingsService(staticResult, dynSettings, maintenance);
}

function modulesDir(): string {
  return path.resolve(process.cwd(), 'modules');
}

export async function buildDeps(): Promise<Result<OrchestratorDeps, AppError>> {
  const log = logger.child({ module: 'bot-server' });
  const shutdownManager = buildShutdownManager();

  try {
    await prisma.$connect();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new AppError('bot-server.startup.database_unreachable', { error: msg }));
  }

  const eventBusResult = await buildEventBus(log, shutdownManager, redisConfig());
  if (eventBusResult.isErr()) return err(eventBusResult.error);
  const eventBus = eventBusResult.value;

  const cacheResult = await buildCacheService(log, eventBus);
  if (cacheResult.isErr()) return err(cacheResult.error);
  const cache = cacheResult.value;

  const sessionProvider = buildSessionProvider(log, eventBus, cache);
  const settingsService = buildSettingsService(cache, eventBus);

  // Initialize i18next before loading module locale bundles.
  // Without init(), addResourceBundle() silently discards all translations.
  await initI18n();

  const i18nResult = await loadModuleLocales();
  if (i18nResult.isErr()) {
    log.warn({ msg: 'i18n_load_failed', error: i18nResult.error.code });
  }

  const registry = buildModuleRegistry(log, eventBus, modulesDir());

  const sentryInitResult = initSentry();
  const sentryReporter = sentryInitResult.isOk() ? new SentryReporter() : undefined;

  const deps = assembleOrchestratorDeps({
    loadConfig,
    log,
    shutdownManager,
    eventBus,
    cache,
    sessionProvider,
    settingsService,
    registry,
    sentryReporter,
    loadModuleLocales,
    t,
  });

  return ok(deps);
}
