import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { NOTIFIER_ERRORS } from './notifier.errors.js';
import type { NotificationEnqueueOptions, NotificationJobData } from './notifier.types.js';

const JOB_NAME = 'notification.delivery';
const ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;

export interface QueueLike {
  add(name: string, data: NotificationJobData, options: QueueJobOptions): Promise<unknown>;
  addBulk(items: readonly QueueBulkItem[]): Promise<unknown>;
}

export interface QueueJobOptions {
  delay: number;
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

export interface QueueBulkItem {
  name: string;
  data: NotificationJobData;
  opts: QueueJobOptions;
}

export class NotificationQueue {
  constructor(private readonly queue: QueueLike) {}

  async enqueue(job: NotificationJobData, options: NotificationEnqueueOptions): AsyncResult<void> {
    try {
      await this.queue.add(JOB_NAME, job, this.toQueueOptions(options.delayMs));
      return ok(undefined);
    } catch (error) {
      return err(new AppError(NOTIFIER_ERRORS.QUEUE_ENQUEUE_FAILED, error));
    }
  }

  async enqueueMany(
    items: readonly { job: NotificationJobData; options: NotificationEnqueueOptions }[],
  ): AsyncResult<void> {
    try {
      await this.queue.addBulk(
        items.map((item) => ({
          name: JOB_NAME,
          data: item.job,
          opts: this.toQueueOptions(item.options.delayMs),
        })),
      );
      return ok(undefined);
    } catch (error) {
      return err(new AppError(NOTIFIER_ERRORS.QUEUE_BULK_ENQUEUE_FAILED, error));
    }
  }

  private toQueueOptions(delay: number): QueueJobOptions {
    return {
      delay,
      attempts: ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: false,
    };
  }
}
