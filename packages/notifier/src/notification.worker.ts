import { Worker } from 'bullmq';
import type { WorkerOptions } from 'bullmq';
import { AppError } from '@tempot/shared';
import { NOTIFIER_ERRORS } from './notifier.errors.js';
import type { NotificationProcessor } from './notification.processor.js';
import type { NotificationJobData } from './notifier.types.js';

const QUEUE_NAME = 'notifications';
const TELEGRAM_MAX_PER_SECOND = 30;

export function createNotificationWorker(
  processor: NotificationProcessor,
  options: WorkerOptions,
): Worker<NotificationJobData> {
  return new Worker<NotificationJobData>(
    QUEUE_NAME,
    async (job) => {
      const result = await processor.process(job.data);
      if (result.isErr()) {
        throw new AppError(NOTIFIER_ERRORS.WORKER_FAILED, result.error);
      }
    },
    {
      ...options,
      limiter: {
        max: TELEGRAM_MAX_PER_SECOND,
        duration: 1000,
      },
    },
  );
}
