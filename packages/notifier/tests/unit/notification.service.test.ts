import { describe, expect, it } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { NotifierService } from '../../src/notification.service.js';
import type {
  NotificationEnqueueOptions,
  NotificationEventPublisher,
  NotificationJobData,
  NotificationQueuePort,
  NotificationRecipient,
  RecipientResolver,
} from '../../src/index.js';

class MemoryQueue implements NotificationQueuePort {
  readonly jobs: Array<{ job: NotificationJobData; options: NotificationEnqueueOptions }> = [];

  async enqueue(job: NotificationJobData, options: NotificationEnqueueOptions) {
    this.jobs.push({ job, options });
    return ok(undefined);
  }

  async enqueueMany(
    items: readonly { job: NotificationJobData; options: NotificationEnqueueOptions }[],
  ) {
    this.jobs.push(...items);
    return ok(undefined);
  }
}

class StaticResolver implements RecipientResolver {
  constructor(private readonly recipients: readonly NotificationRecipient[]) {}

  async resolve() {
    return ok(this.recipients);
  }
}

class MemoryEvents implements NotificationEventPublisher {
  readonly events: Array<{ name: string; payload: unknown }> = [];

  async publish(name: string, payload: unknown) {
    this.events.push({ name, payload });
    return ok(undefined);
  }
}

describe('NotifierService', () => {
  it('should enqueue a template notification for one user', async () => {
    const queue = new MemoryQueue();
    const service = new NotifierService({
      queue,
      recipientResolver: new StaticResolver([{ userId: 'user-1', chatId: '100', locale: 'ar' }]),
    });

    const result = await service.sendToUser('user-1', {
      templateKey: 'system.alert',
      variables: { severity: 'high' },
      silent: true,
    });

    expect(result.isOk()).toBe(true);
    expect(queue.jobs).toHaveLength(1);
    expect(queue.jobs[0]?.job).toMatchObject({
      templateKey: 'system.alert',
      recipient: { userId: 'user-1', chatId: '100' },
      silent: true,
    });
  });

  it('should reject blank template keys', async () => {
    const queue = new MemoryQueue();
    const service = new NotifierService({ queue });

    const result = await service.sendToUser('user-1', { templateKey: ' ' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('notifier.invalid_template_key');
    expect(queue.jobs).toHaveLength(0);
  });

  it('should apply rate offsets to broadcast jobs', async () => {
    const queue = new MemoryQueue();
    const recipients = Array.from({ length: 35 }, (_, index) => ({
      userId: `user-${index}`,
      chatId: `${index}`,
      locale: 'ar',
    }));
    const service = new NotifierService({
      queue,
      recipientResolver: new StaticResolver(recipients),
    });

    const result = await service.broadcast({ templateKey: 'system.announcement' });

    expect(result.isOk()).toBe(true);
    expect(queue.jobs).toHaveLength(35);
    expect(queue.jobs[0]?.options.delayMs).toBe(0);
    expect(queue.jobs[29]?.options.delayMs).toBe(0);
    expect(queue.jobs[30]?.options.delayMs).toBe(1000);
  });

  it('should publish a broadcast queued event after enqueue succeeds', async () => {
    const queue = new MemoryQueue();
    const events = new MemoryEvents();
    const service = new NotifierService({
      queue,
      events,
      recipientResolver: new StaticResolver([{ userId: 'user-1', chatId: '100', locale: 'ar' }]),
    });

    const result = await service.broadcast({ templateKey: 'system.announcement' });

    expect(result.isOk()).toBe(true);
    expect(events.events[0]).toMatchObject({
      name: 'notification.broadcast.queued',
      payload: { recipientCount: 1, templateKey: 'system.announcement' },
    });
  });

  it('should return resolver errors without enqueueing jobs', async () => {
    const queue = new MemoryQueue();
    const resolver: RecipientResolver = {
      resolve: async () => err(new AppError('user.lookup_failed')),
    };
    const service = new NotifierService({ queue, recipientResolver: resolver });

    const result = await service.sendToRole('ADMIN', { templateKey: 'system.alert' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('user.lookup_failed');
    expect(queue.jobs).toHaveLength(0);
  });

  it('should reject past scheduled notifications', async () => {
    const queue = new MemoryQueue();
    const service = new NotifierService({ queue });

    const result = await service.schedule(
      { kind: 'user', userId: 'user-1' },
      { templateKey: 'system.alert' },
      new Date(Date.now() - 1000),
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('notifier.invalid_schedule_time');
  });
});
