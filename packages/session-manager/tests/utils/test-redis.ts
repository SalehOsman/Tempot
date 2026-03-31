/**
 * TestRedis utility for integration tests.
 * Wraps @testcontainers/redis with a cache adapter compatible with SessionProvider.
 */
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { CacheAdapter } from '../../src/session.provider.js';

export type { CacheAdapter };

/**
 * TestRedis manages a Redis testcontainer lifecycle and exposes a cache adapter
 * that wraps ioredis calls in neverthrow Results.
 */
export class TestRedis {
  private container: StartedRedisContainer | null = null;
  private client: Redis | null = null;

  async start(): Promise<void> {
    // Must pass explicit image string — omitting it passes undefined to GenericContainer
    // which causes an internal `split` call on undefined in testcontainers@11.x.
    this.container = await new RedisContainer('redis:7-alpine').start();
    this.client = new Redis(this.container.getConnectionUrl());
  }

  getConnectionUrl(): string {
    if (!this.container) {
      throw new Error('TestRedis: container not started');
    }
    return this.container.getConnectionUrl();
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  /**
   * Returns a cache adapter compatible with SessionProvider.
   * Values are JSON-serialized to/from Redis strings.
   */
  createCacheAdapter(): CacheAdapter {
    const client = this.client;
    if (!client) {
      throw new Error('TestRedis: container not started');
    }

    return {
      get: async <T>(key: string): Promise<Result<T | null, AppError>> => {
        try {
          const raw = await client.get(key);
          if (raw === null) {
            return ok(null);
          }
          const parsed = JSON.parse(raw) as T;
          return ok(parsed);
        } catch (e) {
          return err(new AppError('cache_error', e instanceof Error ? e.message : String(e)));
        }
      },

      set: async <T>(key: string, value: T, ttl?: number): Promise<Result<void, AppError>> => {
        try {
          const serialized = JSON.stringify(value);
          if (ttl !== undefined) {
            await client.set(key, serialized, 'EX', ttl);
          } else {
            await client.set(key, serialized);
          }
          return ok(undefined);
        } catch (e) {
          return err(new AppError('cache_error', e instanceof Error ? e.message : String(e)));
        }
      },

      del: async (key: string): Promise<Result<void, AppError>> => {
        try {
          await client.del(key);
          return ok(undefined);
        } catch (e) {
          return err(new AppError('cache_error', e instanceof Error ? e.message : String(e)));
        }
      },

      expire: async (key: string, ttl: number): Promise<Result<void, AppError>> => {
        try {
          await client.expire(key, ttl);
          return ok(undefined);
        } catch (e) {
          return err(new AppError('cache_error', e instanceof Error ? e.message : String(e)));
        }
      },
    };
  }
}
