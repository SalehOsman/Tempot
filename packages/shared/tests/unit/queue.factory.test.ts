import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueFactory, activeQueues } from '../../src/queue/queue.factory';
import { Queue } from 'bullmq';

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(
      class {
        name: string;
        opts: unknown;
        constructor(name: string, opts: unknown) {
          this.name = name;
          this.opts = opts;
        }
      },
    ),
  };
});

describe('QueueFactory', () => {
  beforeEach(() => {
    activeQueues.length = 0; // Clear the array between tests
    vi.clearAllMocks();
  });

  it('should create a BullMQ queue with default settings', () => {
    const queue = queueFactory('test-queue');

    expect(queue.name).toBe('test-queue');
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect((activeQueues[0] as any).name).toBe('queue-1');
    expect((activeQueues[1] as any).name).toBe('queue-2');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('should allow overriding default options', () => {
    const customOptions = {
      defaultJobOptions: {
        attempts: 5,
      },
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const queue = queueFactory('custom-queue', customOptions as any);
    expect((queue as any).opts.defaultJobOptions.attempts).toBe(5);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });
});
