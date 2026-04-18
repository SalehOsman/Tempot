---
title: Building Event-Driven Communication
description: Step-by-step tutorial to build decoupled inter-module communication using the Tempot event bus
tags:
  - tutorial
  - event-bus
  - architecture
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
---

## Prerequisites

Before you begin, make sure you have:

- A working Tempot development environment (see [Getting Started](/en/tutorials/getting-started/))
- Redis running locally (required for distributed events)
- Basic understanding of the [Shared Package](/en/concepts/shared/) Result pattern

## Building Order-to-Notification Communication

In this tutorial you will connect two modules — an order module that publishes events and a notification module that reacts to them — without any direct imports between them.

### Step 1: Initialize the Event Bus

Create and initialize an `EventBusOrchestrator` at application startup:

```typescript
import { EventBusOrchestrator, type OrchestratorConfig } from '@tempot/event-bus';
import { ShutdownManager } from '@tempot/shared';

const shutdownLogger = {
  info: (msg: string) => process.stderr.write(JSON.stringify({ level: 'info', msg }) + '\n'),
  error: (data: Record<string, unknown>) => process.stderr.write(JSON.stringify(data) + '\n'),
};

const shutdownManager = new ShutdownManager(shutdownLogger);

const config: OrchestratorConfig = {
  redis: { connectionString: 'redis://localhost:6379' },
  logger: shutdownLogger,
  shutdownManager,
};

const eventBus = new EventBusOrchestrator(config);
await eventBus.init();
```

### Step 2: Subscribe to Events in the Notification Module

Register a handler for order completion events. Always subscribe before publishing:

```typescript
await eventBus.subscribe('system.alert.critical', (payload) => {
  process.stderr.write(
    JSON.stringify({ msg: 'Critical alert received', alert: payload.message }) + '\n',
  );
});
```

The handler is registered on both the local and Redis buses, ensuring delivery regardless of which transport is active.

### Step 3: Publish Events from the Order Module

After completing an order, publish a typed event:

```typescript
async function completeOrder(orderId: string) {
  // ... business logic ...

  const publishResult = await eventBus.publish('system.startup.completed', {
    durationMs: 1200,
    modulesLoaded: 5,
    mode: 'production',
  });

  if (publishResult.isErr()) {
    process.stderr.write(
      JSON.stringify({ msg: 'Event publish failed', err: publishResult.error.code }) + '\n',
    );
  }
}
```

The orchestrator routes the event through Redis if available, or falls back to local dispatch.

### Step 4: Validate Event Names

All event names must follow the `{module}.{entity}.{action}` pattern:

```typescript
import { validateEventName } from '@tempot/event-bus';

validateEventName('orders.order.completed'); // true
validateEventName('invalid'); // false
```

Invalid names are rejected with `AppError('event_bus.invalid_name')` when passed to `publish()` or `subscribe()`.

### Step 5: Handle Multiple Subscribers

Multiple modules can subscribe to the same event independently. Each listener runs in isolation:

```typescript
// Analytics module subscribes
await eventBus.subscribe('system.startup.completed', (payload) => {
  process.stderr.write(
    JSON.stringify({ msg: 'Startup tracked', modules: payload.modulesLoaded }) + '\n',
  );
});

// Monitoring module subscribes
await eventBus.subscribe('system.startup.completed', (payload) => {
  if (payload.durationMs > 5000) {
    process.stderr.write(JSON.stringify({ msg: 'Slow startup detected' }) + '\n');
  }
});
```

If one listener throws, the others still receive the event. Errors are logged to stderr without propagating to the publisher.

### Step 6: Clean Up on Shutdown

The orchestrator registers its own shutdown hook if you provided a `ShutdownManager`. Trigger it on process exit:

```typescript
process.on('SIGTERM', async () => {
  await shutdownManager.execute();
  // ConnectionWatcher stops, Redis connections close
});
```

## What You Built

You created event-driven communication between modules that:

- Uses `EventBusOrchestrator` to route events through Redis or local fallback
- Subscribes handlers on both transport layers for guaranteed delivery
- Validates event names against the `{module}.{entity}.{action}` pattern
- Isolates listener failures so one broken handler does not affect others
- Cleans up connections gracefully on shutdown

## Next Steps

- Read the [Event Bus Concepts](/en/concepts/event-bus/) to understand the three-level architecture and ConnectionWatcher
- See the [Using the Event Bus](/en/guides/event-bus/) guide for defining custom event types
- Review the [Architecture Overview](/en/concepts/architecture-overview/) to see how all packages connect
