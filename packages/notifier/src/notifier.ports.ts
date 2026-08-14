import type { AsyncResult, AppError } from '@tempot/shared';
import type {
  DeliveryReceipt,
  DeliveryRequest,
  NotificationAttempt,
  NotificationEnqueueOptions,
  NotificationJobData,
  NotificationPayload,
  NotificationRecipient,
  NotificationTarget,
} from './notifier.types.js';

export interface RecipientResolver {
  resolve(target: NotificationTarget): AsyncResult<readonly NotificationRecipient[], AppError>;
}

export interface NotificationQueuePort {
  enqueue(
    job: NotificationJobData,
    options: NotificationEnqueueOptions,
  ): AsyncResult<void, AppError>;
  enqueueMany(
    items: readonly { job: NotificationJobData; options: NotificationEnqueueOptions }[],
  ): AsyncResult<void, AppError>;
}

export interface TemplateRenderer {
  render(input: {
    templateKey: string;
    variables: Readonly<Record<string, unknown>>;
    locale?: string;
  }): AsyncResult<string, AppError>;
}

export interface DeliveryAdapter {
  deliver(request: DeliveryRequest): AsyncResult<DeliveryReceipt, AppError>;
}

export interface DeliveryAuditSink {
  recordAttempt(attempt: NotificationAttempt): AsyncResult<void, AppError>;
}

export interface NotificationEventPublisher {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

export interface NotifierLogger {
  warn(data: Record<string, unknown>): void;
  error(data: Record<string, unknown>): void;
  info(data: Record<string, unknown>): void;
}

export interface NotifierServiceDeps {
  queue: NotificationQueuePort;
  recipientResolver?: RecipientResolver;
  events?: NotificationEventPublisher;
  logger?: NotifierLogger;
}

export interface NotificationProcessorDeps {
  renderer: TemplateRenderer;
  delivery: DeliveryAdapter;
  audit: DeliveryAuditSink;
  events: NotificationEventPublisher;
  logger?: NotifierLogger;
}

export interface NotificationRequestEnvelope {
  target: NotificationTarget;
  payload: NotificationPayload;
  scheduledAt?: Date;
}
