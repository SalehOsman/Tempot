import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis';
import { ConnectionWatcher } from '../../src/distributed/connection.watcher.js';

describe('ConnectionWatcher', () => {
  let watcher: ConnectionWatcher;
  const mockRedis = {
    ping: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    watcher = new ConnectionWatcher(mockRedis as unknown as Redis, {
      intervalMs: 2000,
      stabilizationThreshold: 5,
    });
  });

  afterEach(() => {
    watcher.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should start with isRedisAvailable() as false', () => {
    expect(watcher.isRedisAvailable()).toBe(false);
  });

  it('should remain false during the first 4 successful pings', async () => {
    mockRedis.ping.mockResolvedValue('PONG');

    watcher.start();

    // 1st ping
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(false);

    // 2nd ping
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(false);

    // 3rd ping
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(false);

    // 4th ping
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(false);
  });

  it('should flip to true on the 5th consecutive successful ping', async () => {
    mockRedis.ping.mockResolvedValue('PONG');
    const onStatusChange = vi.fn();
    watcher.onStatusChange(onStatusChange);

    watcher.start();

    // 1st to 4th pings
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(watcher.isRedisAvailable()).toBe(false);
    expect(onStatusChange).not.toHaveBeenCalled();

    // 5th ping
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(true);
    expect(onStatusChange).toHaveBeenCalledWith(true);
  });

  it('should flip to false immediately on a single failure after being stable', async () => {
    mockRedis.ping.mockResolvedValue('PONG');
    watcher.start();

    // Reach stable state (5 pings)
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(watcher.isRedisAvailable()).toBe(true);

    const onStatusChange = vi.fn();
    watcher.onStatusChange(onStatusChange);

    // Fail next ping
    mockRedis.ping.mockRejectedValue(new Error('Redis Down'));
    await vi.advanceTimersByTimeAsync(2000);

    expect(watcher.isRedisAvailable()).toBe(false);
    expect(onStatusChange).toHaveBeenCalledWith(false);
  });

  it('should reset consecutive pings count on failure during stabilization', async () => {
    mockRedis.ping.mockResolvedValue('PONG');
    watcher.start();

    // 3 successful pings
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(watcher.isRedisAvailable()).toBe(false);

    // 1 failed ping
    mockRedis.ping.mockRejectedValue(new Error('Redis Down'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(false);

    // 4 more successful pings
    mockRedis.ping.mockResolvedValue('PONG');
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(watcher.isRedisAvailable()).toBe(false);

    // 5th successful ping (after the failure)
    await vi.advanceTimersByTimeAsync(2000);
    expect(watcher.isRedisAvailable()).toBe(true);
  });
});
