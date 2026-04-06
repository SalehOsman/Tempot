# ADR-004: Redis + PostgreSQL Dual Session Strategy

**Date:** 2026-03-19
**Status:** Accepted

## Context

grammY requires session storage. Sessions must be fast (read on every message) and durable (survive bot restarts). A pure Redis solution risks data loss on Redis failure.

## Decision

Use a **dual strategy**: Redis for fast reads, PostgreSQL for persistence.

- Redis: primary session store, TTL-based expiry, sub-millisecond reads
- PostgreSQL: async write-through for durability, read fallback when Redis is unavailable
- SessionManager package abstracts both stores behind a single interface

## Consequences

- Fast session reads (Redis hit < 2ms)
- No session loss on Redis restart (PostgreSQL fallback)
- Redis failure handled gracefully per ADR-028 Redis Degradation Strategy
- Session schema versioning enables safe migrations (see Section 15.6)

## Alternatives Rejected

**Redis only:** Sessions lost on Redis restart or memory pressure. Unacceptable for production.

**PostgreSQL only:** Too slow for every-message session reads. Adds DB load for every Telegram message.

**grammY free-form storage:** No type safety, no fallback strategy, no schema versioning.
