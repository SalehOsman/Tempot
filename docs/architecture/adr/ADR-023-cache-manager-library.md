# ADR-023: cache-manager over Custom cache-layer Package

**Date:** 2026-03-19
**Status:** Accepted

## Context

v10 had a `cache-layer` package — a custom multi-tier cache built from scratch. This was 300+ lines of code managing Memory → Redis → DB tiers, TTL synchronisation, and cache invalidation.

## Decision

Replace `cache-layer` with **cache-manager v6.x** (npm: `cache-manager`) combined with Keyv adapters.

Library metrics: 1.7k+ GitHub stars, 2M+ weekly npm downloads, actively maintained.

## Consequences

- 300+ lines of custom cache code replaced by a well-tested library
- `@keyv/redis` provides the Redis tier adapter
- `@keyv/postgres` provides the PostgreSQL fallback tier adapter
- In-memory tier is built into cache-manager
- TTL, invalidation, and multi-tier promotion are handled by the library
- The thin wrapper at `packages/shared/cache.ts` exposes a unified API to the rest of the codebase

## Alternatives Rejected

**Custom cache-layer (v10 approach):** 300+ lines of code to maintain. Bugs in cache invalidation affected multiple packages simultaneously. No community testing.

**ioredis directly:** Single-tier only. No automatic fallback. Manual TTL management in every package.

**node-cache:** In-memory only. No Redis integration.
