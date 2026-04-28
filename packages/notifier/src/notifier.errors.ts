export const NOTIFIER_ERRORS = {
  INVALID_TEMPLATE_KEY: 'notifier.invalid_template_key',
  INVALID_TARGET: 'notifier.invalid_target',
  INVALID_SCHEDULE_TIME: 'notifier.invalid_schedule_time',
  NO_RECIPIENTS: 'notifier.no_recipients',
  RECIPIENT_RESOLVER_REQUIRED: 'notifier.recipient_resolver_required',
  QUEUE_ENQUEUE_FAILED: 'notifier.queue_enqueue_failed',
  QUEUE_BULK_ENQUEUE_FAILED: 'notifier.queue_bulk_enqueue_failed',
  TEMPLATE_RENDER_FAILED: 'notifier.template_render_failed',
  DELIVERY_FAILED: 'notifier.delivery_failed',
  DELIVERY_BLOCKED: 'notifier.delivery_blocked',
  AUDIT_FAILED: 'notifier.audit_failed',
  EVENT_PUBLISH_FAILED: 'notifier.event_publish_failed',
  WORKER_FAILED: 'notifier.worker_failed',
} as const;

export type NotifierErrorCode = (typeof NOTIFIER_ERRORS)[keyof typeof NOTIFIER_ERRORS];
