# Research: Event Bus

## Decisions

### 1. Local Event Delivery

- **Decision:** Use Node.js built-in `EventEmitter` from `node:events` for local (in-process) event delivery.
- **Rationale:** Zero-dependency, sub-millisecond synchronous dispatch. The `EventEmitter` API is stable, well-understood, and provides built-in listener management (`on`, `off`, `listeners`). `maxListeners` is set to 100 to accommodate large module counts without warnings.
- **Alternatives considered:** Custom pub/sub implementation (rejected -- would duplicate EventEmitter functionality without benefit). Third-party libraries like `eventemitter3` (rejected -- marginal performance gain not worth the dependency for an internal bus).

### 2. Distributed Event Transport

- **Decision:** Use `ioredis 5.10.1` with Redis Pub/Sub for cross-instance event delivery.
- **Rationale:** Redis Pub/Sub provides real-time message broadcasting across server instances with minimal latency. ioredis is the most maintained Redis client for Node.js with TypeScript support, connection pooling, and auto-reconnection. Two separate Redis connections are used (one for publishing, one for subscribing) as required by Redis Pub/Sub semantics -- a connection in subscribe mode cannot issue other commands.
- **Alternatives considered:** BullMQ queue-based delivery (referenced in plan but not implemented -- Pub/Sub is simpler and sufficient for the current fire-and-forget event model; BullMQ would be needed only if guaranteed delivery with retries is required). NATS/RabbitMQ (rejected -- adds operational complexity; Redis is already in the stack for caching).

### 3. Connection Health Monitoring

- **Decision:** Implement a custom `ConnectionWatcher` that performs periodic Redis `PING` checks with a stabilization threshold.
- **Rationale:** Redis connections can flap (rapidly alternate between up and down). The stabilization threshold (5 consecutive successful pings at 2-second intervals) prevents the system from switching back to distributed mode during transient recovery. Failure detection is immediate (single failed ping), while recovery requires proof of stability. This asymmetric behavior prioritizes data safety over distributed performance.
- **Alternatives considered:** ioredis built-in reconnection events (rejected -- they report connection-level state, not application-level readiness; a connected Redis instance may still fail `PING` under load). Heartbeat libraries (rejected -- unnecessary dependency for a simple ping loop).

### 4. Graceful Degradation Strategy

- **Decision:** The `EventBusOrchestrator` automatically falls back from Redis to local EventEmitter when Redis becomes unavailable, and promotes back to Redis after stabilization.
- **Rationale:** Implements Rule XXXII (Degradation). Local-only delivery ensures the system remains functional during Redis outages, albeit without cross-instance event distribution. A critical alert is logged with `target: 'SUPER_ADMIN'` on degradation so administrators are notified. Subscriptions are registered on both buses simultaneously so that delivery works regardless of the active mode.
- **Alternatives considered:** Queue-and-retry on Redis recovery (rejected -- adds complexity and potential duplicate delivery; current approach accepts that events during Redis downtime are local-only). Hard failure when Redis is unavailable (rejected -- violates Rule XXXII).

### 5. Event Name Validation

- **Decision:** Enforce `{module}.{entity}.{action}` naming convention via regex validation on every publish and subscribe call.
- **Rationale:** Strict naming convention (Rule XV) prevents ad-hoc event names that would make the system difficult to audit and maintain. The regex `/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i` ensures exactly three dot-separated segments, each starting with a letter. Validation returns `Result.err` rather than throwing exceptions (Rule XXI).
- **Alternatives considered:** TypeScript-only enforcement via `TempotEvents` interface (rejected -- runtime validation is needed because event names can come from dynamic sources). No validation (rejected -- violates Rule XV naming convention requirement).

### 6. Error Handling

- **Decision:** All public methods return `Result<T, AppError>` or `AsyncResult<void>` via `neverthrow 8.2.0`. Listener errors are caught individually and logged to stderr. No exceptions are thrown from public APIs.
- **Rationale:** Strict adherence to Rule XXI (Result pattern). Error codes use hierarchical strings: `event_bus.invalid_name`, `event_bus.publish_failed`, `event_bus.subscribe_failed`. Listener isolation (each listener runs in its own try/catch) ensures a single failing handler does not block delivery to other handlers.
- **Alternatives considered:** None -- Rule XXI is non-negotiable.

### 7. Logging

- **Decision:** Use `process.stderr.write(JSON.stringify(...))` for error logging within the bus implementations. The orchestrator accepts an injected `LoggerInterface` for operational logging.
- **Rationale:** Rule XII prohibits `console.*` calls. The bus classes (`LocalEventBus`, `RedisEventBus`) log handler errors to stderr directly because they operate at a low level where injecting a full logger would complicate the API. The orchestrator, as the high-level facade, accepts a proper logger for degradation alerts.
- **Alternatives considered:** Inject logger into all classes (rejected -- over-engineering for the bus layer where errors are rare edge cases). Silent failure (rejected -- error visibility is critical for debugging).

### 8. Serialization

- **Decision:** Use `JSON.stringify()` / `JSON.parse()` for Redis message serialization.
- **Rationale:** JSON is the universal serialization format in the Tempot stack. Event payloads are plain objects that serialize cleanly to JSON. Parse errors are caught and logged (malformed messages do not crash the bus).
- **Alternatives considered:** MessagePack/Protobuf (rejected -- premature optimization; JSON is human-readable and sufficient for current payload sizes). Structured clone (rejected -- not supported over Redis wire protocol).

### 9. Shutdown Lifecycle

- **Decision:** `EventBusOrchestrator` optionally accepts a `ShutdownManager` from `@tempot/shared` and registers a disposal hook that stops the watcher and quits Redis connections.
- **Rationale:** Ensures clean shutdown of Redis connections and interval timers. The `ShutdownManager` integration is optional (the orchestrator works without it) to support testing scenarios where a full shutdown lifecycle is not needed.
- **Alternatives considered:** `process.on('SIGTERM')` handler in the bus directly (rejected -- lifecycle management belongs to the application layer, not individual packages).

### 10. Typed Publish Contracts (ADR-036)

- **Decision:** Use TypeScript conditional generics on `publish()` methods with a centralized `TempotEvents` interface as the type registry. Consumer packages define structurally-compatible adapter interfaces with method overloads for their specific events.
- **Rationale:** The original `publish(eventName: string, payload: unknown)` signature provided no compile-time safety — callers could pass any payload to any event name. The typed approach catches payload mismatches at compile time while maintaining backward compatibility via a catch-all overload. Consumer adapters use structural typing (not import-time dependency) to avoid coupling to `@tempot/event-bus` at runtime.
- **Alternatives considered:** Branded types on event names (rejected — TypeScript brands don't compose well with string-based event matching). Generic class-level type parameter on EventBus (rejected — would require each consumer to parameterize the bus, complicating DI). Runtime payload validation with Zod schemas (rejected — the goal is compile-time safety; runtime validation is a separate concern and would add overhead to every publish call).

## Implementation Divergences from Plan

The plan was written before implementation and describes a significantly different architecture. The actual implementation diverges in nearly every structural aspect:

| Aspect            | Plan                                                                                                                    | Actual Code                                                                            | Rationale                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture      | Driver-based: `LocalDriver`, `InternalDriver`, `ExternalDriver`                                                         | Bus-based: `LocalEventBus`, `RedisEventBus`, `EventBusOrchestrator`                    | Simpler two-tier model (local + distributed) with an orchestrator facade. The "Internal" level collapsed into local delivery since all modules run in the same process. |
| File structure    | `src/drivers/local.driver.ts`, `src/drivers/external.driver.ts`, `src/types/event.types.ts`                             | `src/local/local.bus.ts`, `src/distributed/redis.bus.ts`, `src/event-bus.contracts.ts` | Flat directory structure with clearer naming. No `drivers/` or `types/` subdirectories.                                                                                 |
| Unified service   | `EventBusService` class with wildcard matching                                                                          | `EventBusOrchestrator` class with degradation routing                                  | Orchestrator focuses on availability-based routing rather than wildcard pattern matching.                                                                               |
| Retry mechanism   | BullMQ worker with 3 retries via `queueFactory`                                                                         | Not implemented                                                                        | No BullMQ dependency exists in the package. Listener errors are caught and logged, not retried.                                                                         |
| Audit logging     | Logger integration in `EventBusService.publish()`                                                                       | Not implemented (logging only for degradation alerts)                                  | Audit log system does not exist yet. Deferred to future work.                                                                                                           |
| Wildcard support  | Regex-based pattern matching in `EventBusService.matches()`                                                             | Not implemented                                                                        | `validateEventName()` uses exact three-part matching. No wildcard subscription API exists.                                                                              |
| Event worker      | `src/workers/event.worker.ts` using BullMQ `Worker`                                                                     | Not implemented                                                                        | No queue-based processing. Events are handled synchronously (local) or via Redis Pub/Sub (distributed).                                                                 |
| Connection health | Not specified in plan                                                                                                   | `ConnectionWatcher` with stabilization threshold                                       | Added to implement Rule XXXII graceful degradation, which the plan did not address.                                                                                     |
| Test files        | `event-naming.test.ts`, `local-driver.test.ts`, `external-driver.test.ts`, `event-retry.test.ts`, `event-audit.test.ts` | `local-bus.test.ts`, `watcher.test.ts`, `redis-bus.test.ts`, `degradation.test.ts`     | Test files reflect actual implementation structure, not the planned driver architecture.                                                                                |
| Dependencies      | BullMQ, Redis, EventEmitter                                                                                             | ioredis, EventEmitter (no BullMQ)                                                      | BullMQ not needed without retry/queue semantics.                                                                                                                        |

### Summary of Divergence

The plan assumed a three-driver architecture (Local, Internal, External) with BullMQ-based retry queues, wildcard matching, and audit logging. The implementation simplified to a two-tier model (local EventEmitter + Redis Pub/Sub) with an orchestrator that handles graceful degradation between the two tiers. Three spec requirements (FR-005 retries, FR-006 audit logging, FR-007 wildcards) remain unimplemented.
