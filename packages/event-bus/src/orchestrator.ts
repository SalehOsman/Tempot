import { AsyncResult } from 'neverthrow';
import { ShutdownManager } from '@tempot/shared';
import { LocalEventBus } from './local/local.bus';
import { RedisEventBus, RedisBusConfig } from './distributed/redis.bus';
import { ConnectionWatcher } from './distributed/connection.watcher';

export interface OrchestratorConfig {
  redis: RedisBusConfig;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  logger: any; // Using any to avoid circular dependency if logger uses event-bus
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Main Orchestrator for the Event Bus.
 * Manages Local vs Distributed routing and graceful degradation.
 * Rule: Rule XXXII (Degradation), ADR-008
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class EventBusOrchestrator {
  private localBus: LocalEventBus;
  private redisBus: RedisEventBus;
  private watcher: ConnectionWatcher;
  private logger: any;

  constructor(config: OrchestratorConfig) {
    this.localBus = new LocalEventBus();
    this.redisBus = new RedisEventBus(config.redis);
    this.logger = config.logger;

    this.watcher = new ConnectionWatcher((this.redisBus as any).pub, {
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
  async subscribe(eventName: string, handler: (payload: any) => void): Promise<void> {
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
/* eslint-enable @typescript-eslint/no-explicit-any */
