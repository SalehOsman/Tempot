# ADR-019: Centralised Queue Factory

**Date:** 2026-03-19
**Status:** Accepted (updated from v10)

## Context

Multiple packages (notifier, document-engine, import-engine, ai-core, backup-engine) each created BullMQ queues independently. v10 had a `queue-manager` package for this, but it was over-engineered — a full package for what is essentially a factory function.

## Decision

Replace the `queue-manager` package with a **factory function** (~30 lines) at `packages/shared/queue.factory.ts`. All queues are created exclusively through this factory.

## Consequences

- Graceful shutdown is guaranteed: the factory registers every queue, and `queueFactory.closeAll()` drains them all in the correct order
- No raw BullMQ `new Queue()` calls allowed anywhere in the codebase
- Connection pooling: all queues share one Redis connection
- Consistent queue configuration (retry strategies, backoff, concurrency) set once in the factory
- ~30 lines vs a full package — significant reduction in complexity

## Alternatives Rejected

**Direct BullMQ instantiation:** Every package sets up its own connection. Graceful shutdown requires knowing every queue. Connection pool fragmented. Retry configuration duplicated.

**queue-manager package (v10 approach):** Full package with its own `package.json`, tests, and API for what amounts to a factory function. Over-engineered.
