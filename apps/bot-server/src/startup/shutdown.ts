import type { ShutdownManager } from '@tempot/shared';
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

/** Injectable process interface for testability */
export interface ProcessLike {
  on: (event: string, handler: () => void) => void;
  exit: (code: number) => void;
}

/**
 * Registers a single shutdown hook and logs a warning if
 * registration fails.
 */
function safeRegister(
  manager: ShutdownManager,
  hook: () => Promise<void>,
  logger: ModuleLogger,
): void {
  const result = manager.register(hook);
  if (result.isErr()) {
    logger.warn({
      module: 'bot-server',
      msg: 'shutdown_hook_registration_failed',
      error: result.error.code,
    });
  }
}

function buildHooks(resources: ShutdownResources): Array<() => Promise<void>> {
  return [
    async () => {
      if (resources.httpServer) await resources.httpServer.close();
    },
    async () => {
      if (resources.bot) await resources.bot.stop();
    },
    async () => {
      if (resources.queueFactory) await resources.queueFactory.closeAll();
    },
    async () => {
      if (resources.cache) await resources.cache.reset();
    },
    async () => {
      if (resources.prisma) await resources.prisma.$disconnect();
    },
    async () => {
      if (resources.drizzlePool) await resources.drizzlePool.end();
    },
    async () => {
      resources.logger.info({ message: 'Shutdown sequence completed' });
    },
  ];
}

/**
 * Register 7 shutdown hooks in Architecture Spec Section 25.3 order.
 *
 * 1. Stop HTTP server  2. Stop bot  3. Drain queues
 * 4. Close cache  5. Close primary DB  6. Close vector DB  7. Log
 */
export function registerShutdownHooks(
  shutdownManager: ShutdownManager,
  resources: ShutdownResources,
): void {
  const hooks = buildHooks(resources);
  for (const hook of hooks) {
    safeRegister(shutdownManager, hook, resources.logger);
  }
}

/**
 * Attach SIGTERM and SIGINT handlers that trigger graceful shutdown.
 * The `processRef` parameter allows injection for testing.
 */
export function setupSignalHandlers(
  shutdownManager: ShutdownManager,
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
    const result = await shutdownManager.execute();
    const durationMs = Date.now() - startTime;

    if (result.isErr()) {
      resources.logger.error({
        module: 'bot-server',
        msg: 'shutdown_completed_with_errors',
        error: result.error.code,
        durationMs,
      });
    }

    await resources.eventBus.publish('system.shutdown.completed', {
      durationMs,
    });

    processRef.exit(0);
  };

  processRef.on('SIGTERM', () => void handleSignal('SIGTERM'));
  processRef.on('SIGINT', () => void handleSignal('SIGINT'));
}
