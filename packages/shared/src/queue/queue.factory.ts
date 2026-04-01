import { Queue, QueueOptions } from 'bullmq';
import { ok, err } from 'neverthrow';
import type { Result } from '../shared.result.js';
import { AppError } from '../shared.errors.js';
import type { ShutdownManager } from '../shutdown/shutdown.manager.js';

const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Options for queueFactory.
 */
export interface QueueFactoryOptions {
  shutdownManager?: ShutdownManager;
  queueOptions?: Partial<QueueOptions>;
}

/**
 * Tracks all active queue instances for shutdown orchestration.
 */
export const activeQueues: Queue[] = [];

/**
 * Standardized factory for BullMQ queues.
 * Ensures consistent retry logic and connection settings across the workspace.
 * Rule: XX (Queues via Queue Factory ONLY), XXI (Result Pattern), ADR-019
 */
export function queueFactory(name: string, options?: QueueFactoryOptions): Result<Queue, AppError> {
  const queueOptions = options?.queueOptions;

  try {
    const queue = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST || DEFAULT_REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || DEFAULT_REDIS_PORT,
      },
      defaultJobOptions: {
        attempts: DEFAULT_RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: DEFAULT_RETRY_DELAY_MS,
        },
      },
      ...queueOptions,
    });

    activeQueues.push(queue);

    if (options?.shutdownManager) {
      options.shutdownManager.register(async () => {
        await queue.close();
      });
    }

    return ok(queue);
  } catch (e) {
    return err(new AppError('shared.queue_factory_failed', e));
  }
}
