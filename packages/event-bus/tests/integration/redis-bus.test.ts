import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { RedisEventBus } from '../../src/distributed/redis.bus';

describe('RedisEventBus Integration', () => {
  let redisContainer: StartedRedisContainer;
  let redisUrl: string;

  beforeAll(async () => {
    redisContainer = await new RedisContainer('redis:latest').start();
    redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
  }, 120_000);

  afterAll(async () => {
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  it('should receive an event published by another instance', async () => {
    const bus1 = new RedisEventBus({ connectionString: redisUrl });
    const bus2 = new RedisEventBus({ connectionString: redisUrl });

    let receivedPayload: unknown = null;
    let receivedEventName: string | null = null;

    const subResult = await bus1.subscribe('user.profile.updated', (payload) => {
      receivedPayload = payload;
      receivedEventName = 'user.profile.updated';
    });
    expect(subResult.isOk()).toBe(true);

    // Short delay to ensure subscription is active in Redis
    await new Promise((resolve) => setTimeout(resolve, 500));

    const payload = { id: '123', name: 'John Doe' };
    const result = await bus2.publish('user.profile.updated', payload);

    expect(result.isOk()).toBe(true);

    // Wait for delivery
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedEventName).toBe('user.profile.updated');
    expect(receivedPayload).toEqual(payload);

    await bus1.dispose();
    await bus2.dispose();
  });

  it('should handle multiple subscribers on same instance', async () => {
    const bus = new RedisEventBus({ connectionString: redisUrl });
    let count = 0;

    const subResult1 = await bus.subscribe('order.created.success', () => {
      count++;
    });
    expect(subResult1.isOk()).toBe(true);
    const subResult2 = await bus.subscribe('order.created.success', () => {
      count++;
    });
    expect(subResult2.isOk()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 500));
    await bus.publish('order.created.success', { id: 'order-1' });

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(count).toBe(2);

    await bus.dispose();
  });
});
