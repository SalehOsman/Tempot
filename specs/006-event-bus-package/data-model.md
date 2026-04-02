# Data Model: Event Bus

## Entities

### `EventLevel`

Discriminator type that classifies the scope of an event. Used to determine routing behavior in the orchestrator.

**Storage:** In-memory only. No database persistence.

**Definition:** Union type (not an enum).

| Value      | Description                                        |
| ---------- | -------------------------------------------------- |
| `LOCAL`    | Intra-process events via Node.js EventEmitter      |
| `INTERNAL` | Module-to-module events within the same deployment |
| `EXTERNAL` | Cross-instance events via Redis Pub/Sub            |

**Source:** `packages/event-bus/src/event-bus.contracts.ts:1`

---

### `EventEnvelope<T>`

The canonical event wrapper that carries metadata alongside the event payload. Generic over the payload type `T` (defaults to `unknown`).

**Storage:** In-memory only. Serialized to JSON for Redis transport, deserialized on receipt. No database persistence.

| Field       | Type         | Description                                     | Constraints / Validation                              |
| ----------- | ------------ | ----------------------------------------------- | ----------------------------------------------------- |
| `eventId`   | `string`     | Unique identifier for this event                | Required                                              |
| `eventName` | `string`     | Dot-separated event identifier                  | Required, validated by `validateEventName()`          |
| `module`    | `string`     | Source module name (first segment of eventName) | Required                                              |
| `userId`    | `string?`    | User who triggered the event                    | Optional                                              |
| `payload`   | `T`          | Event-specific data                             | Required, generic type parameter (default: `unknown`) |
| `timestamp` | `Date`       | When the event was created                      | Required                                              |
| `level`     | `EventLevel` | Routing scope (LOCAL, INTERNAL, EXTERNAL)       | Required, must be a valid `EventLevel` value          |

**Source:** `packages/event-bus/src/event-bus.contracts.ts:3-11`

**Note:** The `EventEnvelope` interface is defined as a contract type but is not directly constructed by the current bus implementations. `LocalEventBus` and `RedisEventBus` accept raw `eventName` + `payload` parameters rather than pre-built envelopes. The envelope type serves as a shared contract for consumers who need to wrap events with metadata.

---

### `TempotEvents`

A centralized TypeScript interface that maps event names to their strongly-typed payload shapes. Acts as a type registry for cross-module event contracts.

**Storage:** Compile-time only. No runtime representation.

| Event Key                         | Payload Fields                                                                                                                                                                              | Description                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `session-manager.session.updated` | `userId: string`, `chatId: string`, `sessionData: unknown`                                                                                                                                  | Session data changed                            |
| `session.redis.degraded`          | `operation: string`, `errorCode: string`, `errorMessage: string`, `timestamp: string`                                                                                                       | Redis connection degraded in session layer      |
| `storage.file.uploaded`           | `attachmentId: string`, `fileName: string`, `originalName: string`, `mimeType: string`, `size: number`, `provider: string`, `moduleId?: string`, `entityId?: string`, `uploadedBy?: string` | File successfully uploaded to storage           |
| `storage.file.deleted`            | `attachmentId: string`, `provider: string`, `providerKey: string`, `deletedBy?: string`, `permanent: boolean`                                                                               | File deleted from storage                       |
| `system.alert.critical`           | `message: string`, `error: string`                                                                                                                                                          | Critical system alert (e.g., cache degradation) |

**Source:** `packages/event-bus/src/event-bus.events.ts:1-35`

### Consumer Event Bus Adapters

Downstream packages define structurally-compatible event bus interfaces with typed method overloads. These are NOT separate entities — they are structural subtypes of `EventBusOrchestrator` that enforce type safety at the consumer boundary without importing `@tempot/event-bus` directly.

| Package                   | Interface         | Typed Events                                                | Source                                                    |
| ------------------------- | ----------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `@tempot/session-manager` | `EventBusAdapter` | `session-manager.session.updated`, `session.redis.degraded` | `packages/session-manager/src/session.provider.ts:34-44`  |
| `@tempot/shared` (cache)  | `EventBus`        | `system.alert.critical`                                     | `packages/shared/src/cache/cache.service.ts:12-18`        |
| `@tempot/storage-engine`  | `StorageEventBus` | `storage.file.uploaded`, `storage.file.deleted`             | `packages/storage-engine/src/storage.interfaces.ts:25-35` |

All adapters include a catch-all overload `publish(eventName: string, payload: unknown)` for forward compatibility. Payload types are structurally identical to `TempotEvents` definitions.

---

### `RedisBusConfig`

Configuration for establishing Redis connections in the distributed event bus.

**Storage:** In-memory only. Passed to constructor.

| Field              | Type     | Description                                           | Constraints / Validation |
| ------------------ | -------- | ----------------------------------------------------- | ------------------------ |
| `connectionString` | `string` | Redis connection URL (e.g., `redis://localhost:6379`) | Required                 |

**Source:** `packages/event-bus/src/distributed/redis.bus.ts:9-11`

---

### `ConnectionWatcherOptions`

Configuration for the Redis health monitoring component.

**Storage:** In-memory only. Passed to constructor.

| Field                    | Type     | Description                                                             | Constraints / Validation                        |
| ------------------------ | -------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| `intervalMs`             | `number` | Milliseconds between health check pings                                 | Required, default: `2000` (set in orchestrator) |
| `stabilizationThreshold` | `number` | Consecutive successful pings required before marking Redis as available | Required, default: `5` (set in orchestrator)    |

**Source:** `packages/event-bus/src/distributed/connection.watcher.ts:3-6`

---

### `OrchestratorConfig`

Configuration for the unified event bus facade.

**Storage:** In-memory only. Passed to constructor.

| Field             | Type               | Description                                     | Constraints / Validation |
| ----------------- | ------------------ | ----------------------------------------------- | ------------------------ |
| `redis`           | `RedisBusConfig`   | Redis connection configuration                  | Required                 |
| `logger`          | `LoggerInterface`  | Logger with `error()` and `info()` methods      | Required                 |
| `shutdownManager` | `ShutdownManager?` | Optional shutdown manager from `@tempot/shared` | Optional                 |

**Source:** `packages/event-bus/src/event-bus.orchestrator.ts:17-21`

---

## Internal State (Not Exported)

### `LocalEventBus` Internal State

| Field     | Type           | Description                                              |
| --------- | -------------- | -------------------------------------------------------- |
| `emitter` | `EventEmitter` | Node.js EventEmitter instance, `maxListeners` set to 100 |

### `RedisEventBus` Internal State

| Field      | Type                                             | Description                                    |
| ---------- | ------------------------------------------------ | ---------------------------------------------- |
| `pub`      | `Redis`                                          | ioredis client for publishing messages         |
| `sub`      | `Redis`                                          | ioredis client for subscribing to channels     |
| `handlers` | `Map<string, Array<(payload: unknown) => void>>` | Registry mapping event names to handler arrays |

### `ConnectionWatcher` Internal State

| Field                  | Type                                       | Description                                                 |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `redis`                | `Redis`                                    | ioredis client used for `PING` health checks                |
| `consecutiveSuccesses` | `number`                                   | Counter of consecutive successful pings (resets on failure) |
| `isAvailable`          | `boolean`                                  | Current availability status (starts `false`)                |
| `timer`                | `NodeJS.Timeout \| null`                   | Interval timer handle                                       |
| `statusCallback`       | `((isAvailable: boolean) => void) \| null` | Registered status change callback                           |

---

## Relationships

```
EventBusOrchestrator (unified facade)
  +-- 1:1 --> LocalEventBus (in-process fallback)
  +-- 1:1 --> RedisEventBus (distributed transport)
  +-- 1:1 --> ConnectionWatcher (health monitor)
                   +-- uses --> RedisEventBus.pubClient (PING target)
```

- `EventBusOrchestrator` owns one `LocalEventBus`, one `RedisEventBus`, and one `ConnectionWatcher`.
- `ConnectionWatcher` monitors the `pubClient` Redis instance from `RedisEventBus`.
- When `ConnectionWatcher` reports Redis as unavailable, the orchestrator routes publishes to `LocalEventBus`.
- Subscriptions are always registered on both `LocalEventBus` and `RedisEventBus` to ensure delivery in either mode.

---

## Storage Mechanisms

- **No database tables.** This package has zero Prisma schema or database models.
- **No persistent queues.** Despite the spec mentioning BullMQ, the implementation uses direct Redis Pub/Sub without queue persistence.
- **Redis Pub/Sub:** Used as a real-time message transport for cross-instance event delivery. Messages are fire-and-forget -- no persistence or replay.
- **In-memory handler registry:** `RedisEventBus` maintains a `Map<string, Array<handler>>` for routing incoming Redis messages to registered handlers.
- **In-memory EventEmitter:** `LocalEventBus` uses Node.js `EventEmitter` for synchronous in-process event delivery.

---

## Data Flow

```
Publisher (any module)
  +-- calls --> EventBusOrchestrator.publish(eventName, payload)
       +-- ConnectionWatcher.isRedisAvailable()?
            |
            +-- YES --> RedisEventBus.publish()
            |              +-- JSON.stringify(payload)
            |              +-- Redis PUBLISH command
            |              +-- Redis delivers to all subscribers
            |              +-- RedisEventBus.handleMessage()
            |                     +-- JSON.parse(message)
            |                     +-- invoke all handlers from Map
            |
            +-- NO  --> LocalEventBus.publish()
                           +-- EventEmitter.listeners(eventName)
                           +-- invoke each listener synchronously
                           +-- catch per-listener errors (isolation)

Subscriber (any module)
  +-- calls --> EventBusOrchestrator.subscribe(eventName, handler)
       +-- LocalEventBus.subscribe() -- registers on EventEmitter
       +-- RedisEventBus.subscribe() -- subscribes to Redis channel + registers in handler Map
```

## Event Name Validation

All publish and subscribe operations validate event names against the pattern:

```
/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i
```

This enforces the `{module}.{entity}.{action}` convention (e.g., `storage.file.uploaded`). Invalid names return `Result.err` with code `event_bus.invalid_name`.
