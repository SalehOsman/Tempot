import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueFactory, activeQueues } from '../../src/queue/queue.factory';
import { Queue } from 'bullmq';
import { ShutdownManager } from '../../src/shutdown/shutdown.manager';
import { AppError } from '../../src/shared.errors';

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(
      class MockQueue {
        name: string;
        opts: unknown;
        constructor(name: string, opts: unknown) {
          this.name = name;
          this.opts = opts;
        }
        async close() {
          // noop
        }
      },
    ),
  };
});

describe('QueueFactory', () => {
  beforeEach(() => {
    activeQueues.length = 0;
    vi.clearAllMocks();
  });

  it('should create a BullMQ queue and return ok Result', () => {
    const result = queueFactory('test-queue');

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeInstanceOf(Queue);
    }

    expect(Queue).toHaveBeenCalledWith(
      'test-queue',
      expect.objectContaining({
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
    );
  });

  it('should track created instances in activeQueues', () => {
    queueFactory('queue-1');
    queueFactory('queue-2');

    expect(activeQueues.length).toBe(2);
    expect(activeQueues[0]).toBeInstanceOf(Queue);
    expect(activeQueues[1]).toBeInstanceOf(Queue);
  });

  it('should allow overriding default options', () => {
    const customOptions = {
      defaultJobOptions: {
        attempts: 5,
      },
    };
    const result = queueFactory('custom-queue', { queueOptions: customOptions });
    expect(result.isOk()).toBe(true);

    expect(Queue).toHaveBeenCalledWith(
      'custom-queue',
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          attempts: 5,
        }),
      }),
    );
  });

  it('should register shutdown hook when shutdownManager is provided', () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const manager = new ShutdownManager(logger);
    const registerSpy = vi.spyOn(manager, 'register');

    queueFactory('queue-with-shutdown', { shutdownManager: manager });

    expect(registerSpy).toHaveBeenCalled();
  });

  it('should not throw when shutdownManager is not provided', () => {
    const result = queueFactory('queue-no-shutdown');
    expect(result.isOk()).toBe(true);
  });

  it('should return err(AppError) when Queue constructor throws', () => {
    vi.mocked(Queue).mockImplementationOnce(function () {
      throw new Error('Redis connection refused');
    } as unknown as typeof Queue);

    const result = queueFactory('failing-queue');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe('shared.queue_factory_failed');
    }
  });
});
