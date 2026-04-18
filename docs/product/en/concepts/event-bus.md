---
title: Event Bus Package
description: Understanding the three-level event architecture, orchestration, and graceful degradation in Tempot
tags:
  - concepts
  - event-bus
  - architecture
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## What is the Event Bus?

The `@tempot/event-bus` package provides decoupled inter-module communication. Modules never call each other directly. All communication flows through typed events, enabling loose coupling and independent deployment.

## Three-Level Architecture

The event bus supports three propagation levels:

| Level      | Transport            | Scope                                          |
| ---------- | -------------------- | ---------------------------------------------- |
| `LOCAL`    | Node.js EventEmitter | Same process                                   |
| `INTERNAL` | Node.js EventEmitter | Same process (collapsed with LOCAL at runtime) |
| `EXTERNAL` | Redis Pub/Sub        | Cross-instance, distributed                    |

In the current implementation, `LOCAL` and `INTERNAL` behave identically using in-process EventEmitter dispatch. The `INTERNAL` level is preserved in the type system for future separation. `EXTERNAL` events use Redis Pub/Sub for cross-instance delivery.

## EventBusOrchestrator

The `EventBusOrchestrator` is the primary API surface. It combines `LocalEventBus`, `RedisEventBus`, and `ConnectionWatcher` into a single unified interface. Consumers interact only with the orchestrator, not with individual bus implementations.

The orchestrator routes events based on Redis availability:

- **Redis available**: `publish()` sends through `RedisEventBus`
- **Redis unavailable**: `publish()` falls back to `LocalEventBus`
- **subscribe()**: Always registers handlers on both buses, ensuring delivery regardless of routing mode

## Event Naming Convention

All event names must follow the `{module}.{entity}.{action}` pattern, validated by regex on every publish and subscribe call. Invalid names are rejected with an `AppError('event_bus.invalid_name')`.

Examples of valid event names:

- `invoices.payment.completed`
- `storage.file.uploaded`
- `system.alert.critical`

## EventEnvelope

Every published event is wrapped in an `EventEnvelope` containing metadata:

| Field       | Description                                   |
| ----------- | --------------------------------------------- |
| `eventId`   | Unique identifier for this event instance     |
| `eventName` | The `{module}.{entity}.{action}` name         |
| `module`    | Originating module                            |
| `userId`    | Optional user attribution                     |
| `payload`   | The typed event data                          |
| `timestamp` | When the event was emitted                    |
| `level`     | Propagation level (LOCAL, INTERNAL, EXTERNAL) |

## Typed Events Registry

The `TempotEvents` interface is the centralized registry of all event contracts across the system. It maps event names to their payload types:

```typescript
interface TempotEvents {
  'storage.file.uploaded': {
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    provider: string;
  };
  'system.alert.critical': {
    message: string;
    error: string;
  };
  // ... 30+ more events
}
```

When publishing or subscribing to a known event name, TypeScript enforces the correct payload type at compile time. Unknown event names fall back to `unknown`.

## ConnectionWatcher

The `ConnectionWatcher` monitors Redis health via periodic `PING` commands. It uses a stabilization threshold: Redis is marked available only after N consecutive successful pings (default: 5). A single failure immediately marks Redis as unavailable. This asymmetric policy prevents flapping on unstable connections.

When Redis becomes unavailable, the orchestrator falls back to local dispatch and logs the degradation. When Redis recovers (passes the stabilization threshold), the orchestrator resumes distributed dispatch.

## Toggle Guard

The event bus can be disabled entirely via `TEMPOT_EVENT_BUS=false`. When disabled, all operations (`publish`, `subscribe`, `init`, `dispose`) silently return `ok()` with no side effects. This allows running Tempot in a minimal configuration without event-driven communication.

## Listener Isolation

Each event listener runs in its own try/catch block. A failing listener does not prevent other listeners from receiving the same event and does not propagate its error to the publisher. Failures are logged to stderr as structured JSON.
