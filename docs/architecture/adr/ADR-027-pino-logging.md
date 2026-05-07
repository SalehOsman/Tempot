# ADR-027: Pino (High-performance logging)

**Date:** 2026-03-21
**Status:** Accepted

## Context

Tempot is an enterprise-grade framework that needs high-performance, structured logging to ensure observability without compromising system throughput. Traditional loggers like Winston or Bunyan are feature-rich but can be slow and memory-intensive in high-load scenarios.

## Decision

Use **Pino** as the primary logging library across all packages and modules.

## Consequences

- Exceptionally fast JSON logging with minimal overhead.
- Native support for standard Pino ecosystem (pino-pretty, pino-abstract-transport).
- Ease of integration with centralized log management systems (ELK, Datadog).
- Consistency in log structures, allowing for better auditing and observability.

## Alternatives Rejected

**Winston:** Highly configurable but significantly slower than Pino and heavier in terms of dependencies.

**Bunyan:** Uses a similar JSON-first approach but is no longer as actively maintained and has a higher performance cost compared to Pino.
