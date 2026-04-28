import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { NOTIFIER_ERRORS } from './notifier.errors.js';
import type { NotificationProcessorDeps } from './notifier.ports.js';
import type { NotificationAttempt, NotificationJobData } from './notifier.types.js';

export class NotificationProcessor {
  constructor(private readonly deps: NotificationProcessorDeps) {}

  async process(job: NotificationJobData): AsyncResult<void> {
    const renderResult = await this.deps.renderer.render({
      templateKey: job.templateKey,
      variables: job.variables,
      locale: job.locale,
    });

    if (renderResult.isErr()) {
      return this.fail(job, renderResult.error);
    }

    const deliveryResult = await this.deps.delivery.deliver({
      recipient: job.recipient,
      text: renderResult.value,
      silent: job.silent,
      metadata: job.metadata,
    });

    if (deliveryResult.isErr()) {
      return this.fail(job, deliveryResult.error);
    }

    await this.recordAttempt(this.toAttempt(job, 'success'));
    await this.publish('notification.delivery.succeeded', {
      jobId: job.id,
      userId: job.recipient.userId,
      templateKey: job.templateKey,
      providerMessageId: deliveryResult.value.providerMessageId,
    });
    return ok(undefined);
  }

  private async fail(job: NotificationJobData, error: AppError): AsyncResult<void> {
    await this.recordAttempt(this.toAttempt(job, 'failed', error.code));
    await this.publish('notification.delivery.failed', {
      jobId: job.id,
      userId: job.recipient.userId,
      templateKey: job.templateKey,
      errorCode: error.code,
    });
    if (error.code === NOTIFIER_ERRORS.DELIVERY_BLOCKED) {
      await this.publish('notification.user.blocked', {
        userId: job.recipient.userId,
        chatId: job.recipient.chatId,
      });
    }
    return err(error);
  }

  private toAttempt(
    job: NotificationJobData,
    status: NotificationAttempt['status'],
    errorCode?: string,
  ): NotificationAttempt {
    return {
      jobId: job.id,
      userId: job.recipient.userId,
      templateKey: job.templateKey,
      status,
      errorCode,
      attemptedAt: new Date().toISOString(),
    };
  }

  private async recordAttempt(attempt: NotificationAttempt): Promise<void> {
    const result = await this.deps.audit.recordAttempt(attempt);
    if (result.isErr()) {
      this.deps.logger?.warn({
        code: NOTIFIER_ERRORS.AUDIT_FAILED,
        error: result.error.code,
        jobId: attempt.jobId,
      });
    }
  }

  private async publish(eventName: string, payload: unknown): Promise<void> {
    const result = await this.deps.events.publish(eventName, payload);
    if (result.isErr()) {
      this.deps.logger?.warn({
        code: NOTIFIER_ERRORS.EVENT_PUBLISH_FAILED,
        eventName,
        error: result.error.code,
      });
    }
  }
}
