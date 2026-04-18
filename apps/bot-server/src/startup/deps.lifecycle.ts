import { registerShutdownHooks, setupSignalHandlers } from './shutdown.js';
import type { ShutdownManager, CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { OrchestratorDeps } from './orchestrator.js';

export interface LifecycleFactoryDeps {
  shutdownManager: ShutdownManager;
  cache: CacheService;
  prismaClient: unknown;
  eventBus: EventBusOrchestrator;
  log: typeof import('@tempot/logger').logger;
}

export function buildLifecycleFactory(deps: LifecycleFactoryDeps): {
  registerShutdownHooks: OrchestratorDeps['registerShutdownHooks'];
  setupSignalHandlers: OrchestratorDeps['setupSignalHandlers'];
} {
  return {
    registerShutdownHooks: (httpServer, bot) =>
      registerShutdownHooks(deps.shutdownManager, {
        httpServer: { close: httpServer.close },
        bot: {
          stop: async () => {
            (bot as { stop?: () => Promise<void> }).stop?.();
          },
        },
        cache: deps.cache,
        prisma: deps.prismaClient as typeof import('@tempot/database').prisma,
        logger: deps.log,
        eventBus: {
          publish: async (event: string, payload: unknown) => {
            await deps.eventBus.publish(event as never, payload as never);
          },
          dispose: () => deps.eventBus.dispose(),
        },
      }),

    setupSignalHandlers: () =>
      setupSignalHandlers(deps.shutdownManager, {
        logger: deps.log,
        eventBus: deps.eventBus,
      }),
  };
}
