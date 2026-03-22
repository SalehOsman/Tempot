# Design Spec — @tempot/event-bus (Dual-Mode Messaging)

## 1. Overview
The `@tempot/event-bus` is the communication nervous system of the Tempot monorepo. It enables loose coupling between modules through a three-tier event system while ensuring high availability via graceful degradation.

## 2. Architecture & Levels

### 2.1 Three-Tier Levels (ADR-008)
1.  **Local:** In-process, synchronous events within the same module.
2.  **Internal:** Cross-module events within the same Node.js instance.
3.  **External:** Distributed events broadcasted across multiple instances via Redis Pub/Sub.

### 2.2 Dual-Mode Strategy
-   **Redis Mode (Primary):** Utilizes Redis Pub/Sub for horizontal scaling and cross-instance communication.
-   **Local Mode (Fallback):** Automatically degrades to a native Node.js `EventEmitter` if Redis is unreachable.

## 3. Reliability & Recovery

### 3.1 Degradation Policy (Rule XXXII)
-   **Best Effort:** If Redis is down, the bus emits events to local/internal listeners only.
-   **No Buffering:** To prevent Memory Leaks (OOM), events are NOT queued in-memory during outages.
-   **Alerting:** Every transition to "Local Mode" strictly emits a `SUPER_ADMIN` alert via `@tempot/logger`.

### 3.2 Auto-Recovery Policy
-   **Stabilization Threshold:** The bus attempts to re-promote to Redis Mode after **5 consecutive successful heartbeat pings** over a **10-second** period.
-   **Anti-Flapping:** Ensures the system doesn't oscillate between modes during intermittent network issues.

## 4. Integration & Standards

### 4.1 Strict Integration
-   **Standard Errors:** Returns `AppError` from `@tempot/shared` for all failures (e.g., `event_bus.publish_failed`).
-   **Result Pattern:** All public methods return `AsyncResult<void>` using `neverthrow`.
-   **Graceful Shutdown:** Registers hooks with `ShutdownManager` to close Redis connections within 30s (Rule XVII).

### 4.2 Naming Convention
-   **Formula:** `{module}.{entity}.{action}`
-   **Constraint:** Lowercase, dot-separated, action verb at the end.

### 4.3 Type Safety
-   The bus utilizes a generic `EventMap` to enforce payload validation at compile-time.
-   **Scaling:** Event types are aggregated to avoid circular dependencies between modules.

## 5. Technical Components

### 5.1 Bus Orchestrator
The main entry point that routes events based on current `BusStatus` (Redis/Local).

### 5.2 Connection Watcher
A background worker that monitors Redis health and manages the stabilization counter for re-promotion.

## 6. Testing Strategy (Strict TDD)
-   **Unit Tests:**
    -   Verify naming convention enforcement.
    -   Verify `EventEmitter` functionality in Local Mode.
    -   Verify the stabilization threshold logic (mocking clocks).
-   **Integration Tests:**
    -   Verify Redis Pub/Sub connectivity using Testcontainers.
    -   Verify degradation and recovery triggers via container stops/starts.
