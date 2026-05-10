# ADR-011: cache-manager as Unified Cache Layer

**Date:** 2026-03-19
**Status:** Accepted (updated from v10)

## Context

Multiple packages (settings, cms-engine, session-manager, search-engine, ai-core) each needed caching. v10 built a custom Hybrid Cache in each package — duplicated logic, inconsistent TTL handling, no unified invalidation.

## Decision

Use **cache-manager v6.x** with Keyv adapters as the single cache layer across all packages. A thin wrapper at `packages/shared/cache.ts` provides a unified API.

## Consequences

- One cache library to maintain and update
- Memory → Redis → PostgreSQL tier hierarchy
- Unified invalidation: clear a key once, it's cleared at all tiers
- 1.7k+ GitHub stars, 2M+ weekly downloads — actively maintained
- `@keyv/redis` and `@keyv/postgres` provide the tier adapters
- Redis failure falls back to DB queries automatically (Constitution Rule XXXII)

## Alternatives Rejected

**Custom Hybrid Cache (v10 approach):** Duplicated in 3+ packages. Different APIs. Bugs fixed in one, missed in others. High maintenance cost.

**ioredis directly:** No multi-tier support. Manual fallback logic in every package. Violates DRY principle.

**node-cache:** In-memory only, no Redis integration, no TTL synchronisation across instances.
