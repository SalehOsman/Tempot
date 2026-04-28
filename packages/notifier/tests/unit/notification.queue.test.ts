import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@tempot/shared';
import { NotificationQueue } from '../../src/notification.queue.js';
import type { NotificationJobData } from '../../src/notifier.types.js';

const job: NotificationJobData = {
  id: 'job-1',
  recipient: { userId: 'user-1', chatId: 'chat-1', locale: 'ar' },
  templateKey: 'system.alert',
  variables: { code: 'A1' },
  locale: 'ar',
  silent: true,
  priority: 'normal',
  metadata: { source: 'test' },
  createdAt: '2026-04-29T00:00:00.000Z',
};

describe('NotificationQueue', () => {
  it('should enqueue one job with the configured delay', async () => {
    const queueLike = {
      add: vi.fn().mockResolvedValue({ id: 'queued-1' }),
      addBulk: vi.fn(),
    };
    const queue = new NotificationQueue(queueLike);

    const result = await queue.enqueue(job, { delayMs: 1500 });

    expect(result.isOk()).toBe(true);
    expect(queueLike.add).toHaveBeenCalledWith('notification.delivery', job, {
      delay: 1500,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  it('should return an AppError when enqueue fails', async () => {
    const queueLike = {
      add: vi.fn().mockRejectedValue(new Error('redis down')),
      addBulk: vi.fn(),
    };
    const queue = new NotificationQueue(queueLike);

    const result = await queue.enqueue(job, { delayMs: 0 });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    expect(result._unsafeUnwrapErr().code).toBe('notifier.queue_enqueue_failed');
  });
});
