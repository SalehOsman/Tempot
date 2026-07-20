# 05 - Programming Risks & Error Handling

This document Audits coding risks, potential bugs, race conditions, async/await handling, and the modular error-handling system in Tempot.

---

## 1. Error Handling Infrastructure

Tempot enforces a strict error-handling strategy (Rules XXI-XXIV) to prevent unhandled promise rejections and silent failures:

* **No Exceptions for Control Flow:** Functions that can fail return a `Result<T, AppError>` or `AsyncResult<T, AppError>` using the `neverthrow` library.
* **Prisma Error Translation:** Repositories translate raw database exceptions into structured `AppError` types using central mapper utilities.
* **Timing-Safe Operations:** Critical routines (e.g., webhook security token validation) use constant-time comparisons to prevent timing side-channel attacks.

---

## 2. Programming Risks & Findings

### IR-001: Request Body Memory Pressure (DoS Risk)
* **Description:** Incoming HTTP requests lacking a `Content-Length` header are fully buffered in memory during parsing in `apps/bot-server/src/server/hono.factory.ts`.
* **Evidence:** In `hono.factory.ts`, body parsing does not enforce stream-based limits before buffering.
* **Scenario:** An attacker sends a stream of infinite bytes without a `Content-Length` header.
* **Impact:** The Hono server attempts to allocate the stream, leading to Out-Of-Memory (OOM) crashes and service denial.
* **Solution:** Configure a Hono middleware to reject requests without a `Content-Length` header or enforce a hard request size limit (e.g., 10MB) at the proxy level.

### IR-002: Rate Limit Client Collision
* **Description:** The client identification logic for rate limiting in `apps/bot-server/src/server/hono.factory.ts` falls back to the generic string `'unknown-client'` when proxy IP headers are missing or malformed.
* **Evidence:** Rate-limiting middleware maps missing IP headers to `'unknown-client'`.
* **Scenario:** A reverse proxy is misconfigured and strips the `X-Forwarded-For` header. One malicious client sends excessive requests, triggering the rate limiter.
* **Impact:** The system blocks `'unknown-client'`, denying service to all legitimate users whose requests also map to `'unknown-client'` due to the stripped header.
* **Solution:** Mandate proxy header validation in production mode. Fall back to throwing a `502 Bad Gateway` error instead of grouping users into a single rate-limit bucket if client headers are missing.

### IR-003: Ingestion of Historical/Stale Context into RAG
* **Description:** The RAG indexer crawls all Markdown files in `docs/` indiscriminately, including legacy project analysis snapshot folders containing outdated findings.
* **Evidence:** `apps/docs/scripts/doc-discovery.ts` crawls the entire `docs/` directory without checking archive/freshness metadata.
* **Scenario:** A user asks the bot "What is the status of the pnpm warning?". The RAG pipeline retrieves `analysis-2026-06-23/00-executive-summary.md` and answers that it is an active blocker, even though the warning was resolved on July 18.
* **Impact:** The bot retrieves stale information, leading to outdated, incorrect, or contradictory responses.
* **Solution:** Create an ingestion manifest that explicitly excludes directories matching `docs/project-analysis/**` or files flagged as `archived: true` in their frontmatter.

---

## 3. Asynchronous and Dependency Risks

* **BullMQ Queue Re-entrancy:** BullMQ queues in `@tempot/notifier` rely on Redis. If connection drops, workers degrade gracefully but need explicit reconnection logic.
* **TypeScript 5.9 Compatibility:** The locked stack pins typescript to version `5.9.3`. Any updates to typescript without updating compiler settings could break strict mode declarations.
