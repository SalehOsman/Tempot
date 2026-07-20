# 08 - Performance Analysis

This document provides a performance audit of the Tempot enterprise Telegram bot framework, focusing on startup routines, caching strategy, and database queries.

---

## 1. Current Performance Baseline

Tempot adopts several high-performance design decisions:

* **Redis Caching (`packages/session-manager`):** Session data, internationalization lookups, and static configurations are cached in Redis to minimize database reads.
* **Vector Index Optimization:** The pgvector embedding table implements a half-vector HNSW (Hierarchical Navigable Small World) index to accelerate RAG semantic searches.
* **Centralized Database Pool:** Prisma 7 database pooling is handled via the `@tempot/database` package, which configures connections efficiently.

---

## 2. Identified Bottlenecks & Analysis

### 2.1. Request Body Parsing Buffer
* **Detail:** Requests to the Hono bot server are fully buffered into memory. A large or slow upload payload blocks the runtime event loop, increasing latency.
* **Remediation:** Enforce streaming body validation and restrict max request size (e.g., 10MB) for file uploads, rejecting larger files before parsing.

### 2.2. Prisma N+1 Query Risk in User Management
* **Detail:** In `user-management`'s text handlers and callback resolvers, retrieving user profiles together with their CASL abilities and session state can result in sequential query calls.
* **Remediation:** Implement Prisma `include` clauses to fetch profile, session, and roles in a single database transaction, caching the composite object in Redis.

### 2.3. Astro Docs Pagefind Indexing
* **Detail:** Building the Astro documentation app generates 2,845 pages. This compilation takes about 3 minutes because Pagefind crawls and indexes the entire filesystem.
* **Remediation:** Limit Pagefind indexing to human-authored guides and exclude the `reference/` directory, which contains generated API docs, to reduce build time by 75%.

---

## 3. Performance Improvement Recommendations

### P1: Enforce Database Connection Pool Limits
Limit the maximum connection pool size in `DATABASE_URL` (e.g., `connection_limit=10`) inside `.env` to prevent the Hono web server and separate BullMQ worker processes from exhausting PostgreSQL connection slots under concurrent load.

### P1: Exclude API Reference from Pagefind
Adjust `astro.config.mjs` to block Pagefind from indexing files matching `docs/product/reference/**`. This cuts docs search build time and reduces Pagefind bundle size for client browsers.

### P2: Dynamic i18n Loading
Load translation namespaces on demand instead of loading all keys (`ar.json` and `en.json`) into memory at boot time, reducing the startup memory footprint of the bot runtime.
