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

export async function buildEventBus(
  log: typeof import('@tempot/logger').logger,
  shutdownManager: ShutdownManager,
  redisConfig: NonNullable<ConstructorParameters<typeof EventBusOrchestrator>[0]['redis']>,
): Promise<Result<EventBusOrchestrator, AppError>> {
  const eventBus = new EventBusOrchestrator({
    redis: redisConfig,
    logger: {
      info: (data: unknown) => log.info(data as object),
      error: (data: unknown) => log.error(data as object),
    },
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
        await eventBus.publish(event as never, payload as never);
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
        await eventBus.publish(event as never, payload as never);
        return ok(undefined);
      },
    },
    repository: sessionRepo,
    logger: { error: (data: unknown) => log.error(data as object) },
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
    logger: {
      info: (data: unknown) => log.info(data as object),
      warn: (data: unknown) => log.warn(data as object),
      debug: (data: unknown) => log.debug(data as object),
      error: (data: unknown) => log.error(data as object),
    },
  });

  const validator = new ModuleValidator({
    specsDir: path.resolve(process.cwd(), 'specs'),
    packagesDir: path.resolve(process.cwd(), 'packages'),
    listDir: async (p: string) => fs.readdir(p),
    pathExists: async (p: string) =>
      fs
        .access(p)
        .then(() => true)
        .catch(() => false),
    logger: {
      info: (data: unknown) => log.info(data as object),
      warn: (data: unknown) => log.warn(data as object),
      debug: (data: unknown) => log.debug(data as object),
      error: (data: unknown) => log.error(data as object),
    },
  });

  return new ModuleRegistry({
    discovery,
    validator,
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await eventBus.publish(event as never, payload as never);
        return ok(undefined);
      },
    },
    logger: {
      info: (data: unknown) => log.info(data as object),
      warn: (data: unknown) => log.warn(data as object),
      debug: (data: unknown) => log.debug(data as object),
      error: (data: unknown) => log.error(data as object),
    },
  });
}
