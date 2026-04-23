# @tempot/event-bus

## 0.2.1

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

- e8414a1: fix(ai-core): post-review fixes — dead code removal, module-reviewer rewrite, tool version events

  Code fixes:
  - Rewrite ModuleReviewer with 5 structured checks (config-completeness, missing-events, ux-compliance, i18n-completeness, test-suggestions)
  - Remove dead code: PROVIDER_REFUSAL error code, AIDegradationMode type
  - Remove phantom dependency @langfuse/otel
  - Add tool version change event emission in ToolRegistry

  Cross-package changes:
  - event-bus: Add ai-core.tool.version_changed event type

  Documentation fixes:
  - Update AI SDK version references from 4.x to 6.x across CLAUDE.md, README.md, plan.md
  - Fix toggle default description (enabled by default, not disabled)
  - Add ADR-037 references to README.md and tempot_v11_final.md
  - Update spec.md HNSW index code to halfvec expression indexing
  - Remove @langfuse/otel references from plan.md
  - Update tempot_v11_final.md §17: directory structure, remove cohere provider, dims 1536→3072, halfvec note

- 9c9b244: feat(bot-server): implement production bot-server application

  New application orchestrating the Tempot Telegram bot:
  - Startup orchestrator with 10-step initialization sequence
  - Config loader with strict env validation (PORT, BOT_TOKEN, WEBHOOK_SECRET)
  - 8-step middleware chain: sanitizer, rate limiter, maintenance, auth (CASL), scoped users, validation, handlers, audit
  - HTTP server (Hono) with webhook reception (timing-safe secret comparison) and health probes
  - Module discovery/validation/loading via @tempot/module-registry
  - Graceful shutdown with ShutdownManager from @tempot/shared
  - Super admin bootstrap and cache warming
  - Error boundary with reference codes and Sentry integration
  - Differentiated rate limiting (global, per-user, per-group) via rate-limiter-flexible
  - 112 unit tests, full TDD

  Cross-package changes:
  - event-bus: Add bot-server lifecycle event types to TempotEvents

- 6d42561: feat(module-registry): implement runtime module discovery and validation engine

  New package providing filesystem-based module discovery, validation, and registration:
  - ModuleDiscovery: scans modules directory, loads module.config.ts via DI, validates against zod schema
  - ModuleValidator: structural checks (7 mandatory paths + conditional database files), spec gate enforcement, dependency validation with toggle guard env var checks (DC-3), name uniqueness, error accumulation (DC-5)
  - ModuleRegistry: orchestrates discover-validate-register pipeline, state machine enforcement, core vs optional module failure handling, query interface (getModule, getAllModules, getAllCommands), command registration via bot API
  - 6 lifecycle events registered in event-bus: discovery.completed, module.validated, module.validation_failed, module.skipped, module.registered, module.disabled
  - 98 tests (19 types, 16 schema, 11 discovery, 23 validator, 18 registry, 9 integration, 2 additional)

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

## 0.2.0

### Minor Changes

- b3bdb83: Add typed publish contracts via TempotEvents conditional generics (ADR-036); add session.redis.degraded and system.alert.critical events to the registry. Type EventBusAdapter in session-manager with method overloads for session-specific events. Change cache EventBus.publish return type from Promise<void> to AsyncResult<void, AppError> and add system.alert.critical typed overload.

### Patch Changes

- Updated dependencies [b3bdb83]
- Updated dependencies [9f1d63f]
  - @tempot/shared@0.1.1
