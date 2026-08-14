# @tempot/event-bus

> Three-tier event system — Local (in-process) → Internal (cross-module) → External (Redis Pub/Sub).

## Purpose

- Decouples modules completely — no direct imports between modules
- Local events: synchronous, zero-latency, in-process only
- Internal events: cross-module communication within the same bot instance
- External events: durable Redis Pub/Sub for scaling across multiple instances
- Retry strategy: 3 attempts with exponential backoff before marking as failed
- 30-second processing timeout per event

## Phase

Phase 2 — The Nervous System

## Dependencies

| Package          | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `emittery` 1.x   | Type-safe EventEmitter for Local + Internal |
| `ioredis`        | Redis Pub/Sub for External events           |
| `@tempot/shared` | AppError, Result                            |
| `@tempot/logger` | Event failure logging                       |

## Event Naming Convention

`{module}.{entity}.{action}` — three parts, lowercase, dot-separated.

```
invoices.payment.completed
users.user.role_changed
cms.translation.updated
document.export.requested
system.backup.failed
```

## API

```typescript
import { eventBus } from '@tempot/event-bus';

// Emit an event
await eventBus.emit('invoices.payment.completed', {
  invoiceId: 'inv-123',
  userId: 'user-456',
  amount: 1500,
});

// Listen for events
eventBus.on('invoices.payment.completed', async (payload) => {
  await notifier.send(payload.userId, 'payment_confirmed');
});

// Listen to all events matching a pattern
eventBus.on('invoices.*', async ({ eventName, payload }) => {
  await auditLogger.log({ action: eventName, ...payload });
});
```

## Event Contract

```typescript
interface EventEnvelope {
  eventId: string; // unique per event
  eventName: string; // module.entity.action
  module: string;
  userId: string | null; // null for system events
  payload: Record<string, unknown>;
  timestamp: Date;
  level: 'local' | 'internal' | 'external';
}
```

## ADRs

- ADR-008 — Event Bus as only inter-module communication channel

## Status

✅ **Implemented** — Phase 1
