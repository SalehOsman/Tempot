import { Queue, QueueOptions } from 'bullmq';
import { ShutdownManager } from '../shutdown/shutdown.manager';

/**
 * Tracks all active queue instances for shutdown orchestration.
 */
export const activeQueues: Queue[] = [];

/**
 * Standardized factory for BullMQ queues.
 * Ensures consistent retry logic and connection settings across the workspace.
 * Rule: XX (Queues via Queue Factory ONLY), ADR-019
 */
export function queueFactory(name: string, options?: Partial<QueueOptions>) {
  const queue = new Queue(name, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
    ...options,
  });

  activeQueues.push(queue);

  // Register for graceful shutdown automatically
  ShutdownManager.register(async () => {
    console.log(`📡 Closing queue: ${name}`);
    await queue.close();
  });

  return queue;
}
