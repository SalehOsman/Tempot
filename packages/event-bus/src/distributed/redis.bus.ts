import { Redis } from 'ioredis';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import { AsyncResult, AppError } from '@tempot/shared';
import { validateEventName } from '../event-bus.contracts.js';
import type { TempotEvents } from '../event-bus.events.js';

const REDIS_MAX_RETRIES_PER_REQUEST = 1;
const REDIS_READY_TIMEOUT_MS = 2000;
const REDIS_QUIT_TIMEOUT_MS = 1000;
const REDIS_RETRY_DELAY_MS = 500;
const REDIS_MAX_RETRY_DELAY_MS = 5000;

export interface RedisBusConfig {
  connectionString: string;
}

export class RedisEventBus {
  private pub: Redis;
  private sub: Redis;
  private handlers: Map<string, Array<(payload: unknown) => void>> = new Map();

  constructor(config: RedisBusConfig) {
    this.pub = createRedisClient(config.connectionString);
    this.sub = createRedisClient(config.connectionString);

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
      await waitForReady(this.pub);
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
        await waitForReady(this.sub);
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
    await Promise.all([closeRedisClient(this.pub), closeRedisClient(this.sub)]);
  }
}

function createRedisClient(connectionString: string): Redis {
  const client = new Redis(connectionString, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: REDIS_MAX_RETRIES_PER_REQUEST,
    retryStrategy: (times) => Math.min(times * REDIS_RETRY_DELAY_MS, REDIS_MAX_RETRY_DELAY_MS),
  });
  client.on('error', () => undefined);
  return client;
}

async function waitForReady(client: Redis): Promise<void> {
  if (isRedisReady(client)) return;
  if (client.status === 'wait' || client.status === 'end') {
    await client.connect();
  }
  if (isRedisReady(client)) return;
  await waitForReadyEvent(client);
}

function isRedisReady(client: Redis): boolean {
  return client.status === 'ready';
}

function waitForReadyEvent(client: Redis): Promise<void> {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onEnd = () => {
      cleanup();
      reject(new Error('Redis connection ended before ready'));
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Redis ready timeout'));
    }, REDIS_READY_TIMEOUT_MS);
    function cleanup(): void {
      clearTimeout(timer);
      client.off('ready', onReady);
      client.off('end', onEnd);
      client.off('error', onError);
    }
    client.once('ready', onReady);
    client.once('end', onEnd);
    client.once('error', onError);
  });
}

async function closeRedisClient(client: Redis): Promise<void> {
  if (client.status !== 'ready') {
    client.disconnect();
    return;
  }
  try {
    await withTimeout(client.quit(), REDIS_QUIT_TIMEOUT_MS);
  } catch {
    client.disconnect();
  }
}

function withTimeout(operation: Promise<unknown>, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Redis quit timeout')), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
