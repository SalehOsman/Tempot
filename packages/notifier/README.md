# @tempot/notifier

> Centralised notification system — individual, bulk, role-based, broadcast, and scheduled messages.

## Purpose

Five notification types, all via BullMQ queue factory to avoid Telegram rate limits:

| Type | Description | Mechanism |
|------|-------------|-----------|
| Individual | Single user by ID | Direct send |
| Bulk | Specific list of users | BullMQ batches |
| By role | All users with a given role | BullMQ batches |
| Broadcast | All active users | BullMQ batches |
| Scheduled | Specific future time | BullMQ delayed job |

All messages use i18n templates — no hardcoded text in notification code.

Disabled by default. Enable with `TEMPOT_NOTIFIER=true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package | Purpose |
|---------|---------|
| `@tempot/shared` | queue factory (BullMQ) |
| `@tempot/i18n-core` | Message templates |
| `@tempot/database` | User lookup by role |
| `@tempot/logger` | Delivery logging |

## API

```typescript
import { notifier } from '@tempot/notifier';

// Individual
await notifier.send(userId, 'invoice.payment_received', { amount: '١٥٠٠ ج.م' });

// Bulk
await notifier.sendBulk(userIds, 'system.maintenance_scheduled', { time: '02:00' });

// By role
await notifier.sendToRole('ADMIN', 'reports.monthly_ready', {});

// Broadcast (all active users)
await notifier.broadcast('system.new_feature', {});

// Scheduled
await notifier.schedule(userId, 'invoice.payment_reminder', payload, scheduledAt);
```

## Telegram Rate Limits

Batch sending respects Telegram limits:
- Max 30 messages/second globally
- Max 1 message/second per chat
- BullMQ workers configured with appropriate concurrency and delays

## Status

⏳ **Not yet implemented** — Phase 4
