import type { ModuleLogger } from '../bot-server.types.js';

/** Resources that may need cleanup during graceful shutdown */
export interface ShutdownResources {
  httpServer?: { close: () => Promise<void> | void };
  bot?: { stop: () => Promise<void> };
  queueFactory?: { closeAll: () => Promise<void> };
  cache?: { reset: () => Promise<unknown> };
  prisma?: { $disconnect: () => Promise<void> };
  drizzlePool?: { end: () => Promise<void> };
  logger: ModuleLogger;
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
    dispose?: () => Promise<unknown>;
  };
}

/** Minimal interface for ShutdownManager dependency injection */
export interface ShutdownManagerLike {
  register: (hook: () => Promise<void>) => { isOk: () => boolean };
  execute: () => Promise<{ isOk: () => boolean }>;
}

/** Injectable process interface for testability */
export interface ProcessLike {
  on: (event: string, handler: () => void) => void;
  exit: (code: number) => void;
}

/**
 * Register 7 shutdown hooks in Architecture Spec Section 25.3 order.
 *
 * 1. Stop HTTP server (no new requests)
 * 2. Complete in-flight bot updates
 * 3. Drain queue workers
 * 4. Close cache connection
 * 5. Close primary database
 * 6. Close vector database
 * 7. Log shutdown completion
 */
export function registerShutdownHooks(
  shutdownManager: ShutdownManagerLike,
  resources: ShutdownResources,
): void {
  shutdownManager.register(async () => {
    if (resources.httpServer) {
      await resources.httpServer.close();
    }
  });

  shutdownManager.register(async () => {
    if (resources.bot) {
      await resources.bot.stop();
    }
  });

  shutdownManager.register(async () => {
    if (resources.queueFactory) {
      await resources.queueFactory.closeAll();
    }
  });

  shutdownManager.register(async () => {
    if (resources.cache) {
      await resources.cache.reset();
    }
  });

  shutdownManager.register(async () => {
    if (resources.prisma) {
      await resources.prisma.$disconnect();
    }
  });

  shutdownManager.register(async () => {
    if (resources.drizzlePool) {
      await resources.drizzlePool.end();
    }
  });

  shutdownManager.register(async () => {
    resources.logger.info({ message: 'Shutdown sequence completed' });
  });
}

/**
 * Attach SIGTERM and SIGINT handlers that trigger graceful shutdown.
 * The `processRef` parameter allows injection for testing.
 */
export function setupSignalHandlers(
  shutdownManager: ShutdownManagerLike,
  resources: ShutdownResources,
  processRef: ProcessLike = process,
): void {
  let shuttingDown = false;

  const handleSignal = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    resources.logger.info({ message: `Received ${signal}, initiating shutdown` });

    await resources.eventBus.publish('system.shutdown.initiated', {
      reason: signal,
    });

    const startTime = Date.now();
    await shutdownManager.execute();
    const durationMs = Date.now() - startTime;

    await resources.eventBus.publish('system.shutdown.completed', {
      durationMs,
    });

    processRef.exit(0);
  };

  processRef.on('SIGTERM', () => void handleSignal('SIGTERM'));
  processRef.on('SIGINT', () => void handleSignal('SIGINT'));
}
