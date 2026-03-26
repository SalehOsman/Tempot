# Feature Specification: Shared Package (Cache & Queue)

**Feature Branch**: `002-shared-package`  
**Created**: 2026-03-19  
**Status**: Complete  
**Input**: User description: "Establish the foundational shared package providing Unified Cache and Queue Factory as per Tempot v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Unified Multi-tier Caching (Priority: P1)

As a developer, I want a single wrapper around `cache-manager` that supports memory and Redis so that I can easily optimize performance without boilerplate.

**Why this priority**: Core architectural requirement (ADR-011, ADR-023) for almost every other feature in the framework.

**Independent Test**: Verified by getting/setting values with TTL and verifying they are stored in the correct tier (Redis) using a Redis CLI or equivalent test container.

**Acceptance Scenarios**:

1. **Given** a cache request, **When** the value exists in Redis but not memory, **Then** it is fetched from Redis and cached in memory for faster subsequent access.
2. **Given** a Redis failure, **When** I attempt to use the cache, **Then** the system falls back to direct DB queries or in-memory temporary storage (Degradation Rule XXXII).

---

### User Story 2 - Standardized Queue Creation (Priority: P1)

As a developer, I want a factory function for BullMQ so that all background jobs follow the same configuration and error handling.

**Why this priority**: Required for notifications, document generation, and data imports (ADR-019).

**Independent Test**: Creating a queue via the `QueueFactory` and processing a test job within an integration test.

**Acceptance Scenarios**:

1. **Given** a queue name, **When** I use the `QueueFactory`, **Then** a BullMQ queue is created with standardized Redis connection and retry settings from `.env`.
2. **Given** a failed background job, **When** the job reaches its maximum retries, **Then** it is automatically moved to the dead-letter queue and an audit event is triggered.

---

## Edge Cases

- **Redis Connection Loss**: What happens when Redis goes down? (Answer: Graceful fallback and immediate alert to SUPER_ADMIN as per Rule XXXII).
- **Cache Invalidation**: How to handle cache invalidation for updated database records? (Answer: Centralized `CacheService.delete(key)` must be used).
- **Job Overlap**: Preventing multiple workers from picking up the same job (Answer: Standard BullMQ locking is used).

## Clarifications

- **Technical Constraints**: Uses `cache-manager` 5.x+ with Keyv adapters for multi-tier caching. `BullMQ` for queues.
- **Constitution Rules**: Rule XIX (Cache via cache-manager ONLY) and Rule XX (Queues via Queue Factory ONLY) are foundational. Rule XXXII (Redis Degradation Strategy) must be implemented here.
- **Integration Points**: `CacheService` and `QueueFactory` are used by almost all other packages (e.g., `notifier`, `cms-engine`, `session-manager`).
- **Edge Cases**: Redis connection loss triggers immediate fallback to in-memory/DB and alerts `SUPER_ADMIN`. Job overlap is prevented by BullMQ's native locking.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a `CacheService` wrapper around `cache-manager` 5.x+.
- **FR-002**: System MUST support multi-tier caching (Memory → Redis) using Keyv adapters.
- **FR-003**: System MUST provide a `queueFactory` function in `packages/shared/queue.factory.ts` (~30 lines).
- **FR-004**: System MUST automatically inject `Redis` connection parameters from `.env` into all cache and queue instances.
- **FR-005**: System MUST implement standardized error handling for Redis connection loss.
- **FR-006**: System MUST support hierarchical cache keys (e.g., `user:123:profile`).
- **FR-007**: System MUST provide a `GracefulShutdown` hook for all cache and queue instances.

### Key Entities

- **CacheService**: Singleton or factory for interacting with `cache-manager`.
- **QueueFactory**: Pure function returning BullMQ `Queue` and `Worker` instances.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Cache retrieval from Redis tier must take < 10ms on average.
- **SC-002**: Background job processing with BullMQ must be operational with < 50 lines of setup code per module.
- **SC-003**: System must pass 100% of integration tests using Testcontainers (Redis).
- **SC-004**: System successfully falls back to in-memory cache during Redis simulated failure.
