import { AsyncResult } from 'neverthrow';
import { ShutdownManager } from '@tempot/shared';
import { LocalEventBus } from './local/local.bus';
import { RedisEventBus, RedisBusConfig } from './distributed/redis.bus';
import { ConnectionWatcher } from './distributed/connection.watcher';

/**
 * Minimal logger interface for the event bus.
 * Avoids circular dependency with the main logger package.
 */
interface LoggerInterface {
  error: (data: Record<string, unknown>) => void;
  info: (message: string) => void;
}

export interface OrchestratorConfig {
  redis: RedisBusConfig;
  logger: LoggerInterface;
}

/**
 * Main Orchestrator for the Event Bus.
 * Manages Local vs Distributed routing and graceful degradation.
 * Rule: Rule XXXII (Degradation), ADR-008
 */
export class EventBusOrchestrator {
  private localBus: LocalEventBus;
  private redisBus: RedisEventBus;
  private watcher: ConnectionWatcher;
  private logger: LoggerInterface;

  constructor(config: OrchestratorConfig) {
    this.localBus = new LocalEventBus();
    this.redisBus = new RedisEventBus(config.redis);
    this.logger = config.logger;

    this.watcher = new ConnectionWatcher(this.redisBus.pubClient, {
      intervalMs: 2000,
      stabilizationThreshold: 5,
    });

    this.watcher.onStatusChange((available) => {
      if (!available) {
        this.logger.error({
          code: 'SYSTEM_DEGRADATION',
          message: 'CRITICAL: Redis Event Bus unavailable. Falling back to Local Mode.',
          payload: { target: 'SUPER_ADMIN' },
        });
      } else {
        this.logger.info('Redis Event Bus restored. Distributed messaging active.');
      }
    });
  }

  /**
   * Initializes the bus and registers shutdown hooks.
   */
  async init(): Promise<void> {
    this.watcher.start();

    ShutdownManager.register(async () => {
      await this.dispose();
    });
  }

  /**
   * Publishes an event. Uses Redis if available, otherwise falls back to local.
   */
  async publish(eventName: string, payload: unknown): AsyncResult<void> {
    if (this.watcher.isRedisAvailable()) {
      return this.redisBus.publish(eventName, payload);
    }

    return this.localBus.publish(eventName, payload);
  }

  /**
   * Subscribes to an event on BOTH buses to ensure delivery.
   */
  async subscribe(eventName: string, handler: (payload: unknown) => void): Promise<void> {
    this.localBus.subscribe(eventName, handler);
    await this.redisBus.subscribe(eventName, handler);
  }

  /**
   * Cleans up resources.
   */
  async dispose(): Promise<void> {
    this.watcher.stop();
    await this.redisBus.dispose();
  }
}
