import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { WorkerOptions } from 'bullmq';
import { NotificationProcessor } from '../../src/notification.processor.js';
import { createNotificationWorker } from '../../src/notification.worker.js';
import { NOTIFIER_ERRORS } from '../../src/notifier.errors.js';
import type {
  DeliveryAdapter,
  DeliveryAuditSink,
  NotificationEventPublisher,
  NotificationJobData,
  TemplateRenderer,
} from '../../src/index.js';

type WorkerProcessor<T> = (job: { data: T }) => Promise<void>;

type CapturedWorker = {
  name: string;
  processor: WorkerProcessor<NotificationJobData>;
  options: WorkerOptions;
};

const workerMock = vi.hoisted(() => ({
  created: [] as CapturedWorker[],
}));

vi.mock('bullmq', () => ({
  Worker: class WorkerMock<T> {
    constructor(name: string, processor: WorkerProcessor<T>, options: WorkerOptions) {
      workerMock.created.push({
        name,
        processor: processor as WorkerProcessor<NotificationJobData>,
        options,
      });
    }
  },
}));

const job: NotificationJobData = {
  id: 'job-1',
  recipient: { userId: 'user-1', chatId: 'chat-1', locale: 'ar' },
  templateKey: 'system.alert',
  variables: { severity: 'high' },
  locale: 'ar',
  silent: false,
  priority: 'normal',
  metadata: { source: 'unit' },
  createdAt: '2026-04-29T00:00:00.000Z',
};

function createProcessor(
  overrides: Partial<{ renderer: TemplateRenderer; delivery: DeliveryAdapter }> = {},
) {
  const renderer: TemplateRenderer = overrides.renderer ?? {
    render: async () => ok('Rendered message'),
  };
  const delivery: DeliveryAdapter = overrides.delivery ?? {
    deliver: async () => ok({ providerMessageId: 'telegram-1' }),
  };
  const audit: DeliveryAuditSink = {
    recordAttempt: async () => ok(undefined),
  };
  const events: NotificationEventPublisher = {
    publish: async () => ok(undefined),
  };
  return new NotificationProcessor({ renderer, delivery, audit, events });
}

describe('createNotificationWorker', () => {
  beforeEach(() => {
    workerMock.created.length = 0;
  });

  it('should create a notifications worker with Telegram-compatible limiter settings', () => {
    createNotificationWorker(createProcessor(), { connection: { host: 'localhost', port: 6379 } });

    expect(workerMock.created).toHaveLength(1);
    expect(workerMock.created[0]?.name).toBe('notifications');
    expect(workerMock.created[0]?.options.limiter).toEqual({ max: 30, duration: 1000 });
  });

  it('should throw worker error when processor returns an AppError', async () => {
    createNotificationWorker(
      createProcessor({
        renderer: { render: async () => err(new AppError(NOTIFIER_ERRORS.TEMPLATE_RENDER_FAILED)) },
      }),
      { connection: { host: 'localhost', port: 6379 } },
    );

    await expect(workerMock.created[0]?.processor({ data: job })).rejects.toMatchObject({
      code: NOTIFIER_ERRORS.WORKER_FAILED,
    });
  });
});
