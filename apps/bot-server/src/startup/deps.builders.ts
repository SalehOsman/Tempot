import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';

import { ShutdownManager, CacheService, AppError } from '@tempot/shared';
import { EventBusOrchestrator } from '@tempot/event-bus';
import { SessionProvider, SessionRepository } from '@tempot/session-manager';
import { ModuleRegistry, ModuleDiscovery, ModuleValidator } from '@tempot/module-registry';
import { buildCacheAdapter } from './cache.adapter.js';

type LoggerLike = typeof import('@tempot/logger').logger;

function toRegistryLogger(log: LoggerLike) {
  return {
    info: (data: Record<string, unknown>) => log.info(data),
    warn: (data: Record<string, unknown>) => log.warn(data),
    debug: (data: Record<string, unknown>) => log.debug(data),
    error: (data: Record<string, unknown>) => log.error(data),
  };
}

export async function buildEventBus(
  log: typeof import('@tempot/logger').logger,
  shutdownManager: ShutdownManager,
  redisConfig: NonNullable<ConstructorParameters<typeof EventBusOrchestrator>[0]['redis']>,
): Promise<Result<EventBusOrchestrator, AppError>> {
  const eventBus = new EventBusOrchestrator({
    redis: redisConfig,
    logger: toRegistryLogger(log),
    shutdownManager,
  });
  const busInitResult = await eventBus.init();
  if (busInitResult.isErr()) return err(busInitResult.error);
  return ok(eventBus);
}

export async function buildCacheService(
  log: typeof import('@tempot/logger').logger,
  eventBus: EventBusOrchestrator,
): Promise<Result<CacheService, AppError>> {
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
  if (cacheInitResult.isErr()) return err(cacheInitResult.error);
  return ok(cache);
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

// In Docker, process.cwd() is /app, which is the correct root
// In development, process.cwd() is also the project root
const ROOT_DIR = process.cwd();

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

  // In production (Docker), packages are in node_modules/.pnpm
  // In development, packages are in packages/
  const packagesDir =
    process.env['NODE_ENV'] === 'production'
      ? path.resolve(ROOT_DIR, 'node_modules/.pnpm')
      : path.resolve(ROOT_DIR, 'packages');

  const validator = new ModuleValidator({
    specsDir: path.resolve(ROOT_DIR, 'specs'),
    packagesDir,
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
