import Redis from 'ioredis';
import { ok, err } from 'neverthrow';
import { AsyncResult, AppError } from '@tempot/shared';
import { validateEventName } from '../contracts';

export interface RedisBusConfig {
  connectionString: string;
}

/**
 * Distributed implementation of the event bus using Redis Pub/Sub.
 * Rule: Rule XXXII (Degradation), ADR-008
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class RedisEventBus {
  private pub: Redis;
  private sub: Redis;
  private handlers: Map<string, Array<(payload: any) => void>> = new Map();

  constructor(config: RedisBusConfig) {
    this.pub = new Redis(config.connectionString, {
      maxRetriesPerRequest: null,
    });
    this.sub = new Redis(config.connectionString, {
      maxRetriesPerRequest: null,
    });

    this.sub.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Publishes an event to Redis.
   */
  async publish(eventName: string, payload: unknown): AsyncResult<void> {
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

  /**
   * Subscribes a handler to a Redis channel.
   */
  async subscribe(eventName: string, handler: (payload: any) => void): Promise<void> {
    if (!validateEventName(eventName)) {
      throw new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`);
    }

    const currentHandlers = this.handlers.get(eventName) || [];
    if (currentHandlers.length === 0) {
      await this.sub.subscribe(eventName);
    }

    currentHandlers.push(handler);
    this.handlers.set(eventName, currentHandlers);
  }

  /**
   * Internal message handler.
   */
  private handleMessage(channel: string, message: string): void {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;

    try {
      const payload = JSON.parse(message);
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[RedisEventBus] Error in handler for ${channel}:`, error);
        }
      }
    } catch (error) {
      console.error(`[RedisEventBus] Failed to parse message on ${channel}:`, error);
    }
  }

  /**
   * Closes connections.
   */
  async dispose(): Promise<void> {
    await Promise.all([this.pub.quit(), this.sub.quit()]);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
