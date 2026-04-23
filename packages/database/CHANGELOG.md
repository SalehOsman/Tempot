# @tempot/database

## 0.1.2

### Patch Changes

- 7e49350: feat(ai-core): implement ai-core package with full TDD

  New package providing provider-agnostic AI capabilities:
  - Provider factory with pluggable Gemini/OpenAI registry
  - Resilience service (circuit breaker, retry, timeout, bulkhead)
  - Rate limiter with per-role limits and Redis backend
  - Embedding service with pgvector storage (3072-dim, halfvec HNSW)
  - RAG pipeline with role-based content access matrix
  - Intent router with multi-step agentic generation and tool use
  - Confirmation engine with 5-minute TTL and 6-digit codes
  - Audit service with fire-and-log pattern
  - Content ingestion with chunking and text metadata
  - Conversation memory with session summarization
  - Developer assistant and module reviewer CLI tools
  - Toggle guard for feature flag control

  Cross-package changes:
  - database: Update VECTOR_DIMENSIONS to 3072, add halfvec expression HNSW index
  - event-bus: Add 5 ai-core event types to TempotEvents

- 4d1dac3: feat(settings): implement hybrid configuration system

  New package providing typed access to static and dynamic settings:
  - StaticSettingsLoader: zod-validated .env reading at startup
  - DynamicSettingsService: type-safe CRUD with 5-min cache TTL
  - MaintenanceService: maintenance mode with super admin bypass
  - SettingsService: unified facade composing all sub-services
  - SettingsRepository: Prisma-based DB abstraction for Setting model
  - Event emission for all setting changes via Event Bus
  - Graceful degradation: returns defaults when DB unavailable
  - Cache failure fallback: falls through to DB (NFR-005)
  - 48 unit tests, 5 integration tests with Testcontainers

## 0.1.1

### Patch Changes

- Updated dependencies [b3bdb83]
- Updated dependencies [9f1d63f]
  - @tempot/shared@0.1.1
