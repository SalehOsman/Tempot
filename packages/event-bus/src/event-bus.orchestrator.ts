import { okAsync, errAsync } from 'neverthrow';
import { AsyncResult, ShutdownManager, AppError } from '@tempot/shared';
import type { Redis } from 'ioredis';
import { LocalEventBus } from './local/local.bus.js';
import { RedisEventBus, RedisBusConfig } from './distributed/redis.bus.js';
import { ConnectionWatcher } from './distributed/connection.watcher.js';
import { eventBusToggle } from './event-bus.toggle.js';
import type { TempotEvents } from './event-bus.events.js';

const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 2000;
const DEFAULT_STABILIZATION_THRESHOLD = 5;

export interface LoggerInterface {
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
  private pendingRedisSubscriptions: Map<string, Array<(payload: unknown) => void>> = new Map();

  constructor(config: OrchestratorConfig) {
    this.localBus = new LocalEventBus();
    this.redisBus = new RedisEventBus(config.redis);
    this.logger = config.logger;
    this.shutdownManager = config.shutdownManager;

    this.watcher = new ConnectionWatcher(this.redisBus.pubClient, {
      intervalMs: DEFAULT_HEALTH_CHECK_INTERVAL_MS,
      stabilizationThreshold: DEFAULT_STABILIZATION_THRESHOLD,
    });

    this.watcher.onStatusChange((available) => {
      if (!available) {
        this.logger.error({
          code: 'event_bus.redis_unavailable',
          fallback: 'local',
          target: 'SUPER_ADMIN',
        });
        this.localBus.publish('system.alert.critical', {
          message: 'Redis event bus degraded to local memory bus',
          error: 'Redis connection lost',
        });
      } else {
        this.logger.info({ code: 'event_bus.redis_restored', mode: 'distributed' });
        this.flushPendingRedisSubscriptions().catch((error: unknown) => {
          this.logger.error({
            code: 'event_bus.redis_resubscribe_failed',
            error: String(error),
          });
        });
      }
    });
  }

  async init(): AsyncResult<void> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

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

  async publish<K extends string>(
    eventName: K,
    payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown,
  ): AsyncResult<void> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    if (this.watcher.isRedisAvailable()) {
      const redisResult = await this.redisBus.publish(eventName, payload);
      if (redisResult.isOk() || redisResult.error.code === 'event_bus.invalid_name') {
        return redisResult;
      }
      this.logger.error({
        code: 'event_bus.redis_publish_degraded',
        eventName,
        error: redisResult.error.code,
      });
    }
    return this.localBus.publish(eventName, payload);
  }

  async subscribe<K extends string>(
    eventName: K,
    handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void,
  ): AsyncResult<void> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    const localResult = this.localBus.subscribe(eventName, handler);
    if (localResult.isErr()) {
      return errAsync(localResult.error);
    }

    if (!this.watcher.isRedisAvailable()) {
      this.addPendingRedisSubscription(eventName, handler as (payload: unknown) => void);
      return okAsync(undefined);
    }

    const redisResult = await this.redisBus.subscribe(eventName, handler);
    if (redisResult.isOk() || redisResult.error.code === 'event_bus.invalid_name') {
      return redisResult;
    }
    this.addPendingRedisSubscription(eventName, handler as (payload: unknown) => void);
    this.logger.error({
      code: 'event_bus.redis_subscribe_degraded',
      eventName,
      error: redisResult.error.code,
    });
    return okAsync(undefined);
  }

  public getRedisClient(): Redis {
    return this.redisBus.pubClient;
  }

  async dispose(): AsyncResult<void> {
    const disabled = eventBusToggle.check();
    if (disabled) return disabled;

    this.watcher.stop();
    try {
      await this.redisBus.dispose();
      return okAsync(undefined);
    } catch (error) {
      return errAsync(new AppError('event_bus.dispose_failed', error));
    }
  }

  private addPendingRedisSubscription(
    eventName: string,
    handler: (payload: unknown) => void,
  ): void {
    const handlers = this.pendingRedisSubscriptions.get(eventName) ?? [];
    handlers.push(handler);
    this.pendingRedisSubscriptions.set(eventName, handlers);
  }

  private async flushPendingRedisSubscriptions(): Promise<void> {
    for (const [eventName, handlers] of this.pendingRedisSubscriptions.entries()) {
      const remaining = await this.subscribePendingHandlers(eventName, handlers);
      if (remaining.length > 0) {
        this.pendingRedisSubscriptions.set(eventName, remaining);
        return;
      }
      this.pendingRedisSubscriptions.delete(eventName);
    }
  }

  private async subscribePendingHandlers(
    eventName: string,
    handlers: Array<(payload: unknown) => void>,
  ): Promise<Array<(payload: unknown) => void>> {
    for (let index = 0; index < handlers.length; index++) {
      const result = await this.redisBus.subscribe(eventName, handlers[index]);
      if (result.isErr()) {
        this.logger.error({
          code: 'event_bus.redis_resubscribe_failed',
          eventName,
          error: result.error.code,
        });
        return handlers.slice(index);
      }
    }
    return [];
  }
}
