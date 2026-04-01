# Research: Shared Package

## Decisions

### 1. Error Handling Library

- **Decision:** Use `neverthrow 8.2.0` for the Result Pattern. Wrap its `Result` and create `AsyncResult` type aliases with `AppError` as the default error type.
- **Rationale:** Rule XXI mandates the Result Pattern with `Result<T, AppError>` via neverthrow. No thrown exceptions in public APIs. The type aliases (`Result<T, E = AppError>` and `AsyncResult<T, E = AppError>`) reduce boilerplate by defaulting the error type, so consumers write `Result<string>` instead of `Result<string, AppError>` throughout the codebase.
- **Alternatives considered:** `fp-ts` Either (rejected -- much larger surface area, steep learning curve, overkill for error-only use case). `oxide.ts` (rejected -- less mature ecosystem, fewer TypeScript users). Native try/catch (rejected -- Rule XXI explicitly forbids thrown exceptions in domain code).

### 2. AppError Design

- **Decision:** Single `AppError` class extending `Error` with `code`, `details`, `i18nKey`, and `loggedAt` fields. Hierarchical string codes (e.g., `shared.cache_get_failed`) instead of numeric codes or enums.
- **Rationale:** Rule XXII mandates hierarchical error codes. String codes are self-documenting and composable -- each package prefixes with its module name (`shared.*`, `auth.*`, `regional.*`). The `i18nKey` field (auto-derived as `errors.{code}`) enables direct i18n lookup without a mapping layer. The `loggedAt` field prevents double-logging (Rule XXIII) -- once set by the logger, downstream handlers skip re-logging.
- **Alternatives considered:** Enum-based error codes (rejected -- enums are closed sets that require modifying the shared package when any downstream package adds new errors). Subclass per error type (rejected -- excessive class hierarchy for what is fundamentally a data carrier). Numeric HTTP-style codes (rejected -- not descriptive enough for domain errors).

### 3. Cache Library

- **Decision:** Use `cache-manager 6.4.0` (v6 with Keyv adapters). The `CacheService` wraps `createCache()` from cache-manager.
- **Rationale:** Rule XIX mandates that all caching goes through `cache-manager`. Version 6.x switched from custom store adapters to Keyv-based adapters, which is a cleaner abstraction. The `CacheService` wrapper adds Result Pattern compliance, graceful degradation, and EventBus integration on top of cache-manager's core functionality.
- **Alternatives considered:** Direct Redis client (`ioredis`) (rejected -- Rule XIX explicitly mandates cache-manager as the only cache interface). `keyv` directly without cache-manager (rejected -- cache-manager provides multi-tier support and TTL management that would need to be reimplemented). `lru-cache` for in-memory only (rejected -- Redis tier is required for multi-instance deployments).

### 4. Cache Degradation Strategy

- **Decision:** On `init()` failure, attempt fallback to in-memory cache (`createCache()` with no store arguments). Publish `system.alert.critical` event via EventBus if available. Log warning via `CacheLogger` if available. Return `err(AppError)` only if both primary and fallback initialization fail.
- **Rationale:** Rule XXXII mandates graceful degradation on Redis failure. The double-init approach (try primary, catch and try memory-only) ensures the application remains functional even when Redis is unavailable. The EventBus alert notifies SUPER_ADMIN of the degradation. The optional `EventBus` and `CacheLogger` constructor parameters avoid circular dependencies with `@tempot/event-bus` and `@tempot/logger`.
- **Alternatives considered:** Throw immediately on failure (rejected -- Rule XXXII requires graceful fallback). Silent fallback without notification (rejected -- operational visibility requires alerting). Required EventBus dependency (rejected -- creates circular dependency since event-bus itself may depend on shared).

### 5. Queue Library

- **Decision:** Use `BullMQ 5.71.0` via a factory function (`queueFactory`). Factory returns `Result<Queue, AppError>`.
- **Rationale:** Rule XX mandates that all queues are created via the Queue Factory. BullMQ is the only queue library specified in the architecture (ADR-019). The factory pattern ensures consistent Redis connection settings (`REDIS_HOST`, `REDIS_PORT`), default retry configuration (`attempts: 3`, exponential backoff), and centralized tracking via `activeQueues` array.
- **Alternatives considered:** `bull` v4 (rejected -- BullMQ is the successor, specified in the architecture). `bee-queue` (rejected -- lacks BullMQ's feature set: repeatable jobs, flow producers, rate limiting). Direct Redis pub/sub (rejected -- no job persistence, retry logic, or dead-letter support). Class-based `QueueService` (rejected -- a simple factory function is sufficient for ~30 lines of logic, avoids unnecessary OOP ceremony).

### 6. Queue Default Configuration

- **Decision:** Default job options: `attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`. Redis connection from environment variables with `localhost:6379` fallback.
- **Rationale:** Three attempts with exponential backoff (1s, 2s, 4s) provides reasonable retry behavior for transient failures without overwhelming the system. Environment-based Redis configuration follows 12-factor app principles. The `Partial<QueueOptions>` override mechanism allows per-queue customization when defaults are insufficient.
- **Alternatives considered:** Fixed delay backoff (rejected -- causes retry storms). Configurable via config file (rejected -- environment variables are simpler and more standard for infrastructure settings). Higher default attempts (rejected -- 3 is standard for transient errors; persistent errors should fail fast).

### 7. Shutdown Manager Design

- **Decision:** Instance-based `ShutdownManager` with constructor-injected logger. Sequential hook execution (FIFO order). 30-second fatal timeout with `process.exit(1)`.
- **Rationale:** Rule XVII mandates graceful shutdown. Instance-based design (not singleton) enables testing without global state. Sequential execution ensures deterministic ordering -- hooks that depend on other services being alive run first. The 30-second timeout is a safety net for hooks that hang (e.g., waiting for a database connection that will never come). The fatal timeout uses `process.stderr.write` (not `console.error`) per Rule XII.
- **Alternatives considered:** Singleton pattern (rejected -- makes testing difficult, requires reset between tests). Parallel hook execution (rejected -- hooks may have implicit ordering dependencies, e.g., queue must close before Redis connection). No timeout (rejected -- hanging hooks would prevent process exit, requiring external kill). Configurable timeout (deferred -- 30s is reasonable for all current use cases).

### 8. Dependency Injection Strategy

- **Decision:** Use interface-based dependency injection for cross-package dependencies (`EventBus`, `CacheLogger`, `ShutdownLogger`). Define minimal interfaces locally in the shared package.
- **Rationale:** The shared package is at the bottom of the dependency graph -- it cannot import from `@tempot/event-bus` or `@tempot/logger` without creating circular dependencies. Minimal local interfaces (e.g., `CacheLogger` with only `warn()`) keep the contract surface small. Consuming packages pass their implementations at construction time.
- **Alternatives considered:** Full import of `@tempot/logger` (rejected -- circular dependency). No logger at all (rejected -- operational visibility requires logging, especially for degradation scenarios). Global DI container (rejected -- adds complexity and a framework dependency for what is solved by constructor parameters).

## Implementation Divergences from Plan

The plan.md for this package is a stub pointing to a non-existent superpowers plan file (`docs/superpowers/plans/2026-03-19-002-shared-package.md`). Since the detailed plan was never persisted, divergences are documented against the spec.md requirements and the plan.md stub's feature table.

| Aspect                       | Spec / Plan                                     | Actual Code                                          | Rationale                                                                                          |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Multi-tier caching (FR-002)  | Memory + Redis multi-tier with Keyv adapters    | Memory-only via `createCache()` with no store config | Redis tier is configured by consuming packages; shared provides the wrapper only                   |
| Cache-manager version        | Spec says "5.x+" (FR-001)                       | `cache-manager 6.4.0` (v6)                           | v6 was current at implementation time; uses Keyv adapters instead of v5 custom stores              |
| QueueFactory file path       | Spec says `packages/shared/queue.factory.ts`    | `packages/shared/src/queue/queue.factory.ts`         | Follows project convention of `src/` subdirectory with domain grouping                             |
| Worker creation (FR-003)     | Spec mentions `Queue` and `Worker` instances    | Factory creates `Queue` only, no `Worker`            | Workers are created by consuming packages (notifier, import-engine) with their own processor logic |
| Dead-letter queue            | Spec mentions dead-letter queue and audit event | Not implemented in shared                            | BullMQ handles DLQ natively; audit events are the responsibility of consuming packages             |
| Redis env injection (FR-004) | Spec says "from `.env`"                         | Direct `process.env.REDIS_HOST/PORT` reads           | No `.env` file loading in shared; consuming app loads dotenv at entry point                        |
| ShutdownManager naming       | Spec says `GracefulShutdown` hook (FR-007)      | Class named `ShutdownManager`                        | More descriptive name; "graceful shutdown" describes the behavior, not the class                   |
| CacheService pattern         | Spec says "Singleton or factory"                | Plain class (neither singleton nor factory)          | Consumers instantiate and manage lifecycle; singleton would complicate testing                     |
