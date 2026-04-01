/**
 * TestRedis utility for integration tests.
 * Wraps @testcontainers/redis with a cache adapter compatible with SessionProvider.
 */
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { CacheAdapter } from '../../src/session.provider.js';

export type { CacheAdapter };

function wrapCacheError(e: unknown): AppError {
  return new AppError('session.cache_error', e instanceof Error ? e.message : String(e));
}

function createCacheGet(client: Redis) {
  return async <T>(key: string): Promise<Result<T | null, AppError>> => {
    try {
      const raw = await client.get(key);
      if (raw === null) return ok(null);
      return ok(JSON.parse(raw) as T);
    } catch (e) {
      return err(wrapCacheError(e));
    }
  };
}

function createCacheSet(client: Redis) {
  return async <T>(key: string, value: T, ttl?: number): Promise<Result<void, AppError>> => {
    try {
      const serialized = JSON.stringify(value);
      if (ttl !== undefined) {
        await client.set(key, serialized, 'EX', ttl);
      } else {
        await client.set(key, serialized);
      }
      return ok(undefined);
    } catch (e) {
      return err(wrapCacheError(e));
    }
  };
}

function createCacheDel(client: Redis) {
  return async (key: string): Promise<Result<void, AppError>> => {
    try {
      await client.del(key);
      return ok(undefined);
    } catch (e) {
      return err(wrapCacheError(e));
    }
  };
}

function createCacheExpire(client: Redis) {
  return async (key: string, ttl: number): Promise<Result<void, AppError>> => {
    try {
      await client.expire(key, ttl);
      return ok(undefined);
    } catch (e) {
      return err(wrapCacheError(e));
    }
  };
}

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
      get: createCacheGet(client),
      set: createCacheSet(client),
      del: createCacheDel(client),
      expire: createCacheExpire(client),
    };
  }
}
