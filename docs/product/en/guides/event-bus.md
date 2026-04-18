---
title: Using the Event Bus
description: Practical guide to publishing events, subscribing to handlers, and configuring the orchestrator in Tempot
tags:
  - guide
  - event-bus
  - architecture
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Overview

The `@tempot/event-bus` package provides decoupled inter-module communication via typed events. This guide covers initializing the orchestrator, publishing and subscribing to events, defining new event types, and configuring the connection watcher.

## Initializing the Orchestrator

The `EventBusOrchestrator` is the primary API surface. Create and initialize it at application startup:

```typescript
import { EventBusOrchestrator, type OrchestratorConfig } from '@tempot/event-bus';

const config: OrchestratorConfig = {
  redis: { connectionString: process.env.REDIS_URL! },
  logger: pinoLogger,
  shutdownManager,
};

const eventBus = new EventBusOrchestrator(config);
const initResult = await eventBus.init();

if (initResult.isErr()) {
  logger.error({ err: initResult.error, msg: 'Event bus init failed' });
}
```

The orchestrator creates a `LocalEventBus`, `RedisEventBus`, and `ConnectionWatcher` internally. If a `ShutdownManager` is provided, it registers a cleanup hook that stops the watcher and disconnects Redis on shutdown.

## Publishing Events

Use `publish()` with a typed event name and payload:

```typescript
await eventBus.publish('storage.file.uploaded', {
  attachmentId: 'att_123',
  fileName: 'report.pdf',
  originalName: 'Q4 Report.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  provider: 's3',
});
```

The orchestrator routes the event based on Redis availability:

- **Redis available** — sends through `RedisEventBus` for cross-instance delivery
- **Redis unavailable** — falls back to `LocalEventBus` for in-process delivery

Event names must follow the `{module}.{entity}.{action}` pattern. Invalid names are rejected with `AppError('event_bus.invalid_name')`.

## Subscribing to Events

Register handlers with `subscribe()`. Handlers are always registered on both the local and Redis buses:

```typescript
await eventBus.subscribe('storage.file.uploaded', (payload) => {
  // TypeScript enforces the correct payload type
  console.log(`File uploaded: ${payload.fileName}, size: ${payload.size}`);
});
```

Dual subscription ensures delivery regardless of which bus is currently routing. If the orchestrator switches from Redis to local (or vice versa), your handler still receives events.

### Listener Isolation

Each listener runs in its own try/catch block. A failing listener does not prevent other listeners from receiving the same event and does not propagate its error to the publisher.

## Defining New Event Types

Add new events to the `TempotEvents` interface in the event-bus package:

```typescript
interface TempotEvents {
  // existing events...
  'billing.invoice.created': {
    invoiceId: string;
    customerId: string;
    amount: number;
    currency: string;
  };
}
```

Once defined, TypeScript enforces the payload type at compile time for both `publish()` and `subscribe()`. Unknown event names fall back to `unknown`.

## Using the Event Naming Convention

All event names are validated against the `{module}.{entity}.{action}` pattern using `validateEventName`:

```typescript
import { validateEventName } from '@tempot/event-bus';

validateEventName('invoices.payment.completed'); // true
validateEventName('invalid-name'); // false
validateEventName('too.many.segments.here'); // false
```

Valid names use lowercase alphanumeric characters and hyphens within each segment, separated by exactly two dots.

## Configuring the Connection Watcher

The `ConnectionWatcher` monitors Redis health and drives the orchestrator's routing decisions. It is created internally by the orchestrator, but you control its behavior through config:

```typescript
const config: OrchestratorConfig = {
  redis: { connectionString: process.env.REDIS_URL! },
  logger: pinoLogger,
};

// Default behavior:
// - Health check interval: 2000ms
// - Stabilization threshold: 5 consecutive pings
```

The watcher uses an asymmetric policy:

- **Recovery** — Redis is marked available only after 5 consecutive successful `PING` responses
- **Failure** — A single failed `PING` immediately marks Redis as unavailable

This prevents flapping on unstable connections. When Redis becomes unavailable, the orchestrator falls back to local dispatch and logs the degradation.

## Using the Toggle Guard

The event bus can be disabled entirely via environment variable:

```bash
TEMPOT_EVENT_BUS=false
```

When disabled, all operations (`publish`, `subscribe`, `init`, `dispose`) return `ok()` with no side effects. This is useful for running Tempot in a minimal test configuration without Redis.

```typescript
import { eventBusToggle } from '@tempot/event-bus';

if (eventBusToggle.isEnabled()) {
  await eventBus.init();
}
```

## Using LocalEventBus Directly

For testing or single-instance deployments, you can use `LocalEventBus` without the orchestrator:

```typescript
import { LocalEventBus } from '@tempot/event-bus';

const localBus = new LocalEventBus();

localBus.subscribe('system.alert.critical', (payload) => {
  logger.error({ msg: payload.message, error: payload.error });
});

await localBus.publish('system.alert.critical', {
  message: 'Redis connection lost',
  error: 'ECONNREFUSED',
});
```

The `LocalEventBus` uses Node.js `EventEmitter` internally and provides the same typed event interface.

## Best Practices

- Always use the orchestrator in production; use `LocalEventBus` only in tests
- Subscribe before publishing to avoid missing events during startup
- Follow the `{module}.{entity}.{action}` naming convention strictly
- Add new events to the `TempotEvents` interface for compile-time safety
- Let the connection watcher handle Redis failover automatically; do not manage it manually
