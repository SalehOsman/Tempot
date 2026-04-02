import { Redis } from 'ioredis';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import { AsyncResult, AppError } from '@tempot/shared';
import { validateEventName } from '../event-bus.contracts.js';
import type { TempotEvents } from '../event-bus.events.js';

const REDIS_MAX_RETRIES_PER_REQUEST = null;

export interface RedisBusConfig {
  connectionString: string;
}

export class RedisEventBus {
  private pub: Redis;
  private sub: Redis;
  private handlers: Map<string, Array<(payload: unknown) => void>> = new Map();

  constructor(config: RedisBusConfig) {
    this.pub = new Redis(config.connectionString, {
      maxRetriesPerRequest: REDIS_MAX_RETRIES_PER_REQUEST,
    });
    this.sub = new Redis(config.connectionString, {
      maxRetriesPerRequest: REDIS_MAX_RETRIES_PER_REQUEST,
    });

    this.sub.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });
  }

  public get pubClient(): Redis {
    return this.pub;
  }

  async publish<K extends string>(
    eventName: K,
    payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown,
  ): AsyncResult<void> {
    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }

    try {
      const message = JSON.stringify(payload);
      await this.pub.publish(eventName, message);
      return ok(undefined);
    } catch (error) {
      return err(new AppError('event_bus.publish_failed', error));
    }
  }

  async subscribe<K extends string>(
    eventName: K,
    handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void,
  ): AsyncResult<void> {
    if (!validateEventName(eventName)) {
      return errAsync(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }

    const currentHandlers = this.handlers.get(eventName) ?? [];
    if (currentHandlers.length === 0) {
      try {
        await this.sub.subscribe(eventName);
      } catch (error) {
        return errAsync(new AppError('event_bus.subscribe_failed', error));
      }
    }

    currentHandlers.push(handler as (payload: unknown) => void);
    this.handlers.set(eventName, currentHandlers);
    return okAsync(undefined);
  }

  private handleMessage(channel: string, message: string): void {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;

    try {
      const payload = JSON.parse(message);
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          process.stderr.write(
            JSON.stringify({
              level: 'error',
              code: 'event_bus.handler_error',
              channel,
              error: String(error),
            }) + '\n',
          );
        }
      }
    } catch (error) {
      process.stderr.write(
        JSON.stringify({
          level: 'error',
          code: 'event_bus.parse_error',
          channel,
          error: String(error),
        }) + '\n',
      );
    }
  }

  async dispose(): Promise<void> {
    await Promise.all([this.pub.quit(), this.sub.quit()]);
  }
}
