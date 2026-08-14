# @tempot/notifier

Central notification package for Tempot. It accepts i18n template keys, resolves recipients through injected ports, queues one delivery job per recipient, processes delivery through an adapter, records attempts, and publishes notification events.

## Status

Active implementation package. Enable from application composition with `TEMPOT_NOTIFIER=true`.

## Scope

Implemented now:

- Single-user notifications
- Multi-user notifications
- Role-based notifications through `RecipientResolver`
- Broadcast notifications through `RecipientResolver`
- Future scheduled notifications
- Telegram-compatible delivery adapter
- Queue-backed delivery abstraction
- Audit sink and event publisher ports
- Telegram-safe rate offsets for bulk enqueueing

Deferred:

- Email/SMS/WhatsApp adapters
- Dashboard broadcast composer
- Notification history database tables
- Direct user status mutation

## Architecture

The package is intentionally port-based:

```text
Module/App
  -> NotifierService
    -> RecipientResolver
    -> NotificationQueue
      -> NotificationProcessor
        -> TemplateRenderer
        -> DeliveryAdapter
        -> DeliveryAuditSink
        -> NotificationEventPublisher
```

The notifier package does not own the Telegram bot lifecycle. `apps/bot-server` or a future app passes a Telegram-compatible API object into `TelegramDeliveryAdapter`.

## Public API

```typescript
import { NotifierService, NotificationQueue } from '@tempot/notifier';

const notifier = new NotifierService({
  queue: new NotificationQueue(queueLike),
  recipientResolver,
  events,
  logger,
});

await notifier.sendToUser('user-1', {
  templateKey: 'system.alert',
  variables: { severity: 'high' },
  silent: true,
});

await notifier.sendToUsers(['user-1', 'user-2'], {
  templateKey: 'system.maintenance',
});

await notifier.sendToRole('ADMIN', {
  templateKey: 'security.review_required',
});

await notifier.broadcast({
  templateKey: 'system.announcement',
});

await notifier.schedule(
  { kind: 'user', userId: 'user-1' },
  { templateKey: 'reminders.follow_up' },
  new Date(Date.now() + 60_000),
);
```

## Worker Processing

```typescript
import {
  NotificationProcessor,
  TelegramDeliveryAdapter,
  createNotificationWorker,
} from '@tempot/notifier';

const processor = new NotificationProcessor({
  renderer,
  delivery: new TelegramDeliveryAdapter(bot.api),
  audit,
  events,
  logger,
});

const worker = createNotificationWorker(processor, { connection });
```

The worker applies a BullMQ limiter of 30 jobs per second. The service also applies enqueue-time delay offsets for bulk jobs as a defense-in-depth measure.

## Events

- `notification.broadcast.queued`
- `notification.delivery.succeeded`
- `notification.delivery.failed`
- `notification.user.blocked`

## Error Codes

- `notifier.invalid_template_key`
- `notifier.invalid_target`
- `notifier.invalid_schedule_time`
- `notifier.no_recipients`
- `notifier.recipient_resolver_required`
- `notifier.queue_enqueue_failed`
- `notifier.queue_bulk_enqueue_failed`
- `notifier.template_render_failed`
- `notifier.delivery_failed`
- `notifier.delivery_blocked`
- `notifier.audit_failed`
- `notifier.event_publish_failed`
- `notifier.worker_failed`

## Validation

```bash
pnpm --filter @tempot/notifier test
pnpm --filter @tempot/notifier build
pnpm lint
pnpm spec:validate
pnpm boundary:audit
pnpm module:checklist
```
