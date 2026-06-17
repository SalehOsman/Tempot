import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';

import { ShutdownManager, CacheService, AppError } from '@tempot/shared';
import { EventBusOrchestrator } from '@tempot/event-bus';
import { SessionProvider, SessionRepository } from '@tempot/session-manager';
import { ModuleRegistry, ModuleDiscovery, ModuleValidator } from '@tempot/module-registry';
import { buildCacheAdapter } from './cache.adapter.js';
import { resolveRuntimeDirectory } from './runtime-paths.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';

type LoggerLike = typeof import('@tempot/logger').logger;

function toRegistryLogger(log: LoggerLike) {
  return {
    info: (data: Record<string, unknown>) => log.info(data),
    warn: (data: Record<string, unknown>) => log.warn(data),
    debug: (data: Record<string, unknown>) => log.debug(data),
    error: (data: Record<string, unknown>) => log.error(data),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toStartupError(code: string, error: unknown): AppError {
  return error instanceof AppError ? error : new AppError(code, { error: errorMessage(error) });
}

export async function buildEventBus(
  log: typeof import('@tempot/logger').logger,
  shutdownManager: ShutdownManager,
  redisConfig: NonNullable<ConstructorParameters<typeof EventBusOrchestrator>[0]['redis']>,
): Promise<Result<EventBusOrchestrator, AppError>> {
  try {
    const eventBus = new EventBusOrchestrator({
      redis: redisConfig,
      logger: toRegistryLogger(log),
      shutdownManager,
    });
    const busInitResult = await eventBus.init();
    if (busInitResult.isErr()) {
      return err(toStartupError(BOT_SERVER_ERRORS.EVENT_BUS_FAILED, busInitResult.error));
    }
    return ok(eventBus);
  } catch (error: unknown) {
    return err(toStartupError(BOT_SERVER_ERRORS.EVENT_BUS_FAILED, error));
  }
}

export async function buildCacheService(
  log: typeof import('@tempot/logger').logger,
  eventBus: EventBusOrchestrator,
): Promise<Result<CacheService, AppError>> {
  try {
    const cache = new CacheService(
      {
        publish: async (event: string, payload: unknown) => {
          await eventBus.publish(event, payload);
          return ok(undefined);
        },
      },
      { warn: (msg: string) => log.warn({ msg }) },
    );
    const cacheInitResult = await cache.init();
    if (cacheInitResult.isErr()) {
      return err(toStartupError(BOT_SERVER_ERRORS.CACHE_INIT_FAILED, cacheInitResult.error));
    }
    return ok(cache);
  } catch (error: unknown) {
    return err(toStartupError(BOT_SERVER_ERRORS.CACHE_INIT_FAILED, error));
  }
}

export function buildSessionProvider(
  log: typeof import('@tempot/logger').logger,
  eventBus: EventBusOrchestrator,
  cache: CacheService,
): SessionProvider {
  const cacheAdapter = buildCacheAdapter(cache);
  const sessionRepo = new SessionRepository({ log: async () => {} });
  return new SessionProvider({
    cache: cacheAdapter,
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await eventBus.publish(event, payload);
        return ok(undefined);
      },
    },
    repository: sessionRepo,
    logger: { error: (data: Record<string, unknown>) => log.error(data) },
  });
}

export function buildModuleRegistry(
  log: typeof import('@tempot/logger').logger,
  eventBus: EventBusOrchestrator,
  modDir: string,
): ModuleRegistry {
  const discovery = new ModuleDiscovery({
    modulesDir: modDir,
    loadConfig: async (p: string) => import(pathToFileURL(p).href),
    listDir: async (p: string) => fs.readdir(p),
    isDirectory: async (p: string) => (await fs.stat(p)).isDirectory(),
    logger: toRegistryLogger(log),
  });

  const validator = new ModuleValidator({
    specsDir: resolveRuntimeDirectory('specs'),
    packagesDir: resolveRuntimeDirectory('packages'),
    listDir: async (p: string) => {
      try {
        const result = await fs.readdir(p);
        return result;
      } catch (error) {
        log.error({ msg: 'listDir_failed', path: p, error: String(error) });
        throw error;
      }
    },
    pathExists: async (p: string) =>
      fs
        .access(p)
        .then(() => true)
        .catch(() => false),
    logger: toRegistryLogger(log),
  });

  return new ModuleRegistry({
    discovery,
    validator,
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await eventBus.publish(event, payload);
        return ok(undefined);
      },
    },
    logger: toRegistryLogger(log),
  });
}
