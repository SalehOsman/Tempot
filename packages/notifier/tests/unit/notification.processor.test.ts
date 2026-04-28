import { describe, expect, it } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { NotificationProcessor } from '../../src/notification.processor.js';
import type {
  DeliveryAdapter,
  DeliveryAuditSink,
  NotificationAttempt,
  NotificationEventPublisher,
  NotificationJobData,
  TemplateRenderer,
} from '../../src/index.js';

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

class MemoryAudit implements DeliveryAuditSink {
  readonly attempts: NotificationAttempt[] = [];

  async recordAttempt(attempt: NotificationAttempt) {
    this.attempts.push(attempt);
    return ok(undefined);
  }
}

class MemoryEvents implements NotificationEventPublisher {
  readonly events: Array<{ name: string; payload: unknown }> = [];

  async publish(name: string, payload: unknown) {
    this.events.push({ name, payload });
    return ok(undefined);
  }
}

describe('NotificationProcessor', () => {
  it('should render, deliver, audit, and publish success', async () => {
    const audit = new MemoryAudit();
    const events = new MemoryEvents();
    const renderer: TemplateRenderer = {
      render: async () => ok('Rendered message'),
    };
    const delivery: DeliveryAdapter = {
      deliver: async () => ok({ providerMessageId: 'telegram-1' }),
    };
    const processor = new NotificationProcessor({ renderer, delivery, audit, events });

    const result = await processor.process(job);

    expect(result.isOk()).toBe(true);
    expect(audit.attempts[0]).toMatchObject({ status: 'success', jobId: 'job-1' });
    expect(events.events.map((event) => event.name)).toContain('notification.delivery.succeeded');
  });

  it('should skip delivery when template rendering fails', async () => {
    const audit = new MemoryAudit();
    const events = new MemoryEvents();
    const renderer: TemplateRenderer = {
      render: async () => err(new AppError('i18n.missing_template')),
    };
    const delivery: DeliveryAdapter = {
      deliver: async () => ok({ providerMessageId: 'telegram-1' }),
    };
    const processor = new NotificationProcessor({ renderer, delivery, audit, events });

    const result = await processor.process(job);

    expect(result.isErr()).toBe(true);
    expect(audit.attempts[0]).toMatchObject({
      status: 'failed',
      errorCode: 'i18n.missing_template',
    });
  });

  it('should publish user blocked when delivery reports a blocked recipient', async () => {
    const audit = new MemoryAudit();
    const events = new MemoryEvents();
    const renderer: TemplateRenderer = {
      render: async () => ok('Rendered message'),
    };
    const delivery: DeliveryAdapter = {
      deliver: async () => err(new AppError('notifier.delivery_blocked')),
    };
    const processor = new NotificationProcessor({ renderer, delivery, audit, events });

    const result = await processor.process(job);

    expect(result.isErr()).toBe(true);
    expect(events.events.map((event) => event.name)).toContain('notification.user.blocked');
    expect(audit.attempts[0]).toMatchObject({ status: 'failed' });
  });
});
