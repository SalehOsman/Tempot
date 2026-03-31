import { okAsync, errAsync } from 'neverthrow';
import { AsyncResult, ShutdownManager } from '@tempot/shared';
import { LocalEventBus } from './local/local.bus.js';
import { RedisEventBus, RedisBusConfig } from './distributed/redis.bus.js';
import { ConnectionWatcher } from './distributed/connection.watcher.js';

interface LoggerInterface {
  error: (data: Record<string, unknown>) => void;
  info: (data: Record<string, unknown>) => void;
}

export interface OrchestratorConfig {
  redis: RedisBusConfig;
  logger: LoggerInterface;
  shutdownManager?: ShutdownManager;
}

export class EventBusOrchestrator {
  private localBus: LocalEventBus;
  private redisBus: RedisEventBus;
  private watcher: ConnectionWatcher;
  private logger: LoggerInterface;
  private shutdownManager?: ShutdownManager;

  constructor(config: OrchestratorConfig) {
    this.localBus = new LocalEventBus();
    this.redisBus = new RedisEventBus(config.redis);
    this.logger = config.logger;
    this.shutdownManager = config.shutdownManager;

    this.watcher = new ConnectionWatcher(this.redisBus.pubClient, {
      intervalMs: 2000,
      stabilizationThreshold: 5,
    });

    this.watcher.onStatusChange((available) => {
      if (!available) {
        this.logger.error({
          code: 'event_bus.redis_unavailable',
          fallback: 'local',
          target: 'SUPER_ADMIN',
        });
      } else {
        this.logger.info({ code: 'event_bus.redis_restored', mode: 'distributed' });
      }
    });
  }

  async init(): AsyncResult<void> {
    this.watcher.start();

    if (this.shutdownManager) {
      const result = this.shutdownManager.register(async () => {
        await this.dispose();
      });
      if (result.isErr()) {
        return errAsync(result.error);
      }
    }

    return okAsync(undefined);
  }

  async publish(eventName: string, payload: unknown): AsyncResult<void> {
    if (this.watcher.isRedisAvailable()) {
      return this.redisBus.publish(eventName, payload);
    }
    return this.localBus.publish(eventName, payload);
  }

  async subscribe(eventName: string, handler: (payload: unknown) => void): AsyncResult<void> {
    const localResult = this.localBus.subscribe(eventName, handler);
    if (localResult.isErr()) {
      return errAsync(localResult.error);
    }

    return this.redisBus.subscribe(eventName, handler);
  }

  async dispose(): Promise<void> {
    this.watcher.stop();
    await this.redisBus.dispose();
  }
}
