import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { NotificationRatePolicy } from './notification.rate-policy.js';
import { NOTIFIER_ERRORS } from './notifier.errors.js';
import type { NotifierServiceDeps } from './notifier.ports.js';
import type {
  NotificationJobData,
  NotificationPayload,
  NotificationRecipient,
  NotificationTarget,
} from './notifier.types.js';

const DEFAULT_PRIORITY = 'normal';

export class NotifierService {
  private readonly ratePolicy = new NotificationRatePolicy();

  constructor(private readonly deps: NotifierServiceDeps) {}

  sendToUser(userId: string, payload: NotificationPayload): AsyncResult<void> {
    return this.enqueue({ kind: 'user', userId }, payload);
  }

  sendToUsers(userIds: readonly string[], payload: NotificationPayload): AsyncResult<void> {
    return this.enqueue({ kind: 'users', userIds }, payload);
  }

  sendToRole(role: string, payload: NotificationPayload): AsyncResult<void> {
    return this.enqueue({ kind: 'role', role }, payload);
  }

  broadcast(payload: NotificationPayload): AsyncResult<void> {
    return this.enqueue({ kind: 'broadcast' }, payload);
  }

  schedule(
    target: NotificationTarget,
    payload: NotificationPayload,
    scheduledAt: Date,
  ): AsyncResult<void> {
    if (scheduledAt.getTime() <= Date.now()) {
      return Promise.resolve(err(new AppError(NOTIFIER_ERRORS.INVALID_SCHEDULE_TIME)));
    }
    return this.enqueue(target, payload, scheduledAt);
  }

  private async enqueue(
    target: NotificationTarget,
    payload: NotificationPayload,
    scheduledAt?: Date,
  ): AsyncResult<void> {
    const validation = this.validatePayload(payload);
    if (validation.isErr()) return err(validation.error);

    const recipientsResult = await this.resolveRecipients(target);
    if (recipientsResult.isErr()) return err(recipientsResult.error);
    if (recipientsResult.value.length === 0) {
      return err(new AppError(NOTIFIER_ERRORS.NO_RECIPIENTS));
    }

    const baseDelay = scheduledAt ? scheduledAt.getTime() - Date.now() : 0;
    const items = recipientsResult.value.map((recipient, index) => ({
      job: this.createJob(recipient, payload),
      options: { delayMs: baseDelay + this.ratePolicy.delayForIndex(index) },
    }));

    const enqueueResult = await this.deps.queue.enqueueMany(items);
    if (enqueueResult.isErr()) return err(enqueueResult.error);

    await this.publishQueuedEvent(target, payload, items.length);
    return ok(undefined);
  }

  private validatePayload(payload: NotificationPayload) {
    if (payload.templateKey.trim().length === 0) {
      return err(new AppError(NOTIFIER_ERRORS.INVALID_TEMPLATE_KEY));
    }
    return ok(undefined);
  }

  private async resolveRecipients(
    target: NotificationTarget,
  ): AsyncResult<readonly NotificationRecipient[]> {
    if (this.deps.recipientResolver) {
      return this.deps.recipientResolver.resolve(target);
    }
    if (target.kind === 'user') {
      return ok([{ userId: target.userId, chatId: target.userId }]);
    }
    if (target.kind === 'users') {
      return ok(target.userIds.map((userId) => ({ userId, chatId: userId })));
    }
    return err(new AppError(NOTIFIER_ERRORS.RECIPIENT_RESOLVER_REQUIRED));
  }

  private createJob(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
  ): NotificationJobData {
    return {
      id: crypto.randomUUID(),
      recipient,
      templateKey: payload.templateKey,
      variables: payload.variables ?? {},
      locale: payload.locale ?? recipient.locale,
      silent: payload.silent ?? false,
      priority: payload.priority ?? DEFAULT_PRIORITY,
      metadata: payload.metadata ?? {},
      createdAt: new Date().toISOString(),
    };
  }

  private async publishQueuedEvent(
    target: NotificationTarget,
    payload: NotificationPayload,
    recipientCount: number,
  ): Promise<void> {
    if (!this.deps.events || target.kind !== 'broadcast') return;
    const result = await this.deps.events.publish('notification.broadcast.queued', {
      recipientCount,
      templateKey: payload.templateKey,
    });
    if (result.isErr()) {
      this.deps.logger?.warn({
        code: 'notifier.event_publish_failed',
        error: result.error.code,
        eventName: 'notification.broadcast.queued',
      });
    }
  }
}
