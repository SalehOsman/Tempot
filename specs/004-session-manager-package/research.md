# Research: Session Manager (Dual-layer)

## Decisions

### 1. Storage & Caching Layer

- **Decision:** Utilize `packages/shared/cache.ts` for Redis interactions, adhering to ADR-011 and Rule XIX (`cache-manager` with Keyv adapters).
- **Rationale:** Ensures fast, in-memory/Redis access with a unified abstraction, meeting the < 2ms retrieval requirement (SC-001) while adhering strictly to project architectural constraints.
- **Alternatives considered:** Direct `ioredis` usage (rejected due to Rule XIX mandating `cache-manager` ONLY).

### 2. Event-Driven Sync to Postgres

- **Decision:** Use `packages/event-bus` for publishing session update events and `BullMQ` (via `packages/shared/queue.factory.ts`, Rule XX) for background synchronization.
- **Rationale:** Implements a reliable, retriable mechanism to sync Redis state to Postgres (SC-002) without blocking the critical path of the bot server.
- **Alternatives considered:** Synchronous write-through (rejected due to performance impact on bot response time). Simple in-memory background worker (rejected due to lack of reliability and distributed safety).

### 3. Concurrency Control

- **Decision:** Implement Optimistic Concurrency Control (OCC) using a `version` field in the session entity.
- **Rationale:** Prevents lost updates when multiple rapid messages arrive from the same user (a common Telegram scenario), scaling horizontally without the overhead of distributed locks.
- **Alternatives considered:** Redis distributed locks (rejected due to complexity and potential deadlocks). Last-write-wins (rejected due to data loss risk for rapid multi-step interactions).

### 4. Database Access

- **Decision:** Use the existing `BaseRepository` pattern (Rule XIV) from `packages/database` for all Postgres interactions related to session persistence.
- **Rationale:** Strict adherence to project architecture.
- **Alternatives considered:** Direct Prisma usage in the session manager (rejected by Rule XIV).

### 5. Error Handling & Degradation

- **Decision:** Utilize `neverthrow` (`Result<T, AppError>`) and strictly implement Rule XXXII (Redis Degradation) — falling back to in-memory temporary storage on Redis failure (Rule XXXII). PostgreSQL is the async persistence sync target, not a synchronous fallback.
- **Rationale:** Guarantees robustness (SC-003) and alignment with the error-handling constitution rules.
