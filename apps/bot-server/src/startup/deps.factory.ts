import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';

import { logger } from '@tempot/logger';
import { ShutdownManager, AppError } from '@tempot/shared';
import { NodeProtectedDataService, prisma, StaticProtectedDataKeyProvider } from '@tempot/database';

import {
  StaticSettingsLoader,
  BOT_ACCESS_MODES,
  SETTINGS_ERRORS,
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
import { resolveRuntimeDirectory } from './runtime-paths.js';

import { loadConfig } from './config.loader.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import type { OrchestratorDeps } from './orchestrator.js';
import type { CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { ProtectedDataService } from '@tempot/database';

type StartupLogger = Parameters<typeof buildEventBus>[0];
type StartupShutdownManager = ReturnType<typeof buildShutdownManager>;

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
  staticResult: ReturnType<typeof StaticSettingsLoader.load>,
): SettingsService {
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
        botAccessMode: BOT_ACCESS_MODES.private,
        protectedDataKeys: null,
      };

  const maintenance = new MaintenanceService(dynSettings, staticSettings);
  return new SettingsService(staticResult, dynSettings, maintenance);
}

function modulesDir(): string {
  return resolveRuntimeDirectory('modules');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function buildProtectedDataService(
  staticSettingsResult: ReturnType<typeof StaticSettingsLoader.load>,
): Result<ProtectedDataService | undefined, AppError> {
  if (staticSettingsResult.isErr()) return err(staticSettingsResult.error);
  if (!staticSettingsResult.value.protectedDataKeys) {
    return err(new AppError(SETTINGS_ERRORS.PROTECTED_DATA_INVALID_KEY_RING));
  }
  return ok(
    new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider(staticSettingsResult.value.protectedDataKeys),
    ),
  );
}

async function initializeRequiredServices(
  log: StartupLogger,
  shutdownManager: StartupShutdownManager,
): Promise<Result<EventBusOrchestrator, AppError>> {
  const [dbError, eventBusResult, i18nError] = await Promise.all([
    prisma
      .$connect()
      .then(() => null)
      .catch((e: unknown) => errorMessage(e)),
    buildEventBus(log, shutdownManager, redisConfig()),
    initI18n()
      .then(() => null)
      .catch((e: unknown) => errorMessage(e)),
  ]);

  if (dbError !== null) {
    return err(new AppError(BOT_SERVER_ERRORS.DATABASE_UNREACHABLE, { error: dbError }));
  }
  if (eventBusResult.isErr()) return err(eventBusResult.error);
  if (i18nError !== null) {
    return err(new AppError(BOT_SERVER_ERRORS.I18N_INIT_FAILED, { error: i18nError }));
  }
  return ok(eventBusResult.value);
}

export async function buildDeps(): Promise<Result<OrchestratorDeps, AppError>> {
  const log = logger.child({ module: 'bot-server' });
  const shutdownManager = buildShutdownManager();

  const eventBusResult = await initializeRequiredServices(log, shutdownManager);
  if (eventBusResult.isErr()) return err(eventBusResult.error);
  const eventBus = eventBusResult.value;

  const cacheResult = await buildCacheService(log, eventBus);
  if (cacheResult.isErr()) return err(cacheResult.error);
  const cache = cacheResult.value;

  const sessionProvider = buildSessionProvider(log, eventBus, cache);
  const staticSettingsResult = StaticSettingsLoader.load();
  const settingsService = buildSettingsService(cache, eventBus, staticSettingsResult);
  const protectedDataService = buildProtectedDataService(staticSettingsResult);
  if (protectedDataService.isErr()) return err(protectedDataService.error);
  const i18nResult = await loadModuleLocales();
  if (i18nResult.isErr()) {
    log.warn({ msg: 'i18n_load_failed', error: i18nResult.error.code });
  }

  const registry = buildModuleRegistry(log, eventBus, modulesDir());

  const sentryInitResult = initSentry({
    release: process.env['SENTRY_RELEASE'],
    environment: process.env['SENTRY_ENVIRONMENT'] ?? 'production',
  });
  const sentryReporter = sentryInitResult.isOk() ? new SentryReporter() : undefined;

  const deps = assembleOrchestratorDeps({
    loadConfig,
    log,
    shutdownManager,
    eventBus,
    cache,
    sessionProvider,
    settingsService,
    protectedDataService: protectedDataService.value,
    registry,
    sentryReporter,
    loadModuleLocales,
    t,
  });

  return ok(deps);
}
