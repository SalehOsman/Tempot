# AI Core — Task Breakdown

**Feature:** 015-ai-core-package  
**Source:** spec.md (Complete) + plan.md (Corrected) + research.md  
**Generated:** 2026-04-02

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files to create:**

- `packages/ai-core/.gitignore`
- `packages/ai-core/tsconfig.json`
- `packages/ai-core/package.json`
- `packages/ai-core/vitest.config.ts`
- `packages/ai-core/src/index.ts` (empty barrel)
- `packages/ai-core/tests/unit/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [ ] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [ ] `.gitignore` includes: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [ ] `tsconfig.json` extends `../../tsconfig.json`, has `"outDir": "dist"`, `"rootDir": "src"`
- [ ] `package.json` has `"type": "module"`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports": { ".": "./dist/index.js" }`
- [ ] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [ ] Dependencies match plan.md: `ai` (^6.0.0), `@ai-sdk/google`, `@ai-sdk/openai`, `cockatiel`, `rate-limiter-flexible`, `langfuse`, `@langfuse/otel`, `zod`
- [ ] Workspace dependencies: `@tempot/shared`, `@tempot/database`, `@tempot/event-bus`, `@tempot/logger`
- [ ] `vitest.config.ts` matches existing package patterns
- [ ] `src/index.ts` exists as empty barrel file
- [ ] No compiled artifacts in `src/`
- [ ] Existing placeholder `README.md` is preserved (will be rewritten in Prompt B docs sync)

---

## Task 1: Type Definitions, Contracts & Error Codes

**Priority:** P0 (dependency for all service tasks)  
**Estimated time:** 15 min  
**FR:** FR-001, FR-003, FR-008, FR-009, FR-017, FR-019

**Files to create:**

- `packages/ai-core/src/ai-core.types.ts`
- `packages/ai-core/src/ai-core.contracts.ts`
- `packages/ai-core/src/ai-core.errors.ts`

**Test file:** `packages/ai-core/tests/unit/ai-core.types.test.ts`

**Acceptance criteria:**

- [ ] `AIProviderType` type exported: `'gemini' | 'openai'`
- [ ] `AIContentType` type exported: `'ui-guide' | 'bot-functions' | 'db-schema' | 'developer-docs' | 'custom-knowledge' | 'user-memory'`
- [ ] `ConfirmationLevel` type exported: `'none' | 'simple' | 'detailed' | 'escalated'`
- [ ] `AIDegradationMode` type exported: `'graceful' | 'queue' | 'disable'`
- [ ] `AIConfig` interface exported with `enabled`, `provider`, `embeddingModel`, `embeddingDimensions` (3072), `confidenceThreshold` (0.7), `generationTimeoutMs` (30000), `embeddingTimeoutMs` (10000)
- [ ] `ResilienceConfig` interface exported with `circuitBreakerThreshold` (5), `circuitBreakerResetMs` (600000), `retryMaxAttempts` (3), `timeoutMs` (30000), `maxConcurrent` (5)
- [ ] `RateLimitConfig` interface exported with `userLimit` (20), `adminLimit` (50), `superAdminLimit` (0=unlimited), `windowMs` (86400000)
- [ ] `ChunkingConfig` interface exported with `chunkSizeTokens` (500), `overlapTokens` (50), `maxDocumentBytes` (10485760)
- [ ] `AITool` interface exported with `name`, `description`, `parameters` (ZodSchema), `requiredPermission` ({action, subject}), `confirmationLevel`, `version`, `execute`
- [ ] `AISession` interface exported with `userId`, `isActive`, `conversationHistory`, `startedAt`, `messageCount`
- [ ] `EmbeddingInput` interface exported with `contentId`, `contentType`, `content` (string|Buffer), `metadata?`
- [ ] `EmbeddingSearchOptions` interface exported with `query`, `contentTypes`, `limit?`, `confidenceThreshold?`
- [ ] `EmbeddingSearchResult` interface exported with `contentId`, `contentType`, `score`, `metadata`
- [ ] `ContentChunk` interface exported with `text`, `chunkIndex`, `totalChunks`, `metadata`
- [ ] `DEFAULT_AI_CONFIG`, `DEFAULT_RESILIENCE_CONFIG`, `DEFAULT_RATE_LIMIT_CONFIG`, `DEFAULT_CHUNKING_CONFIG` constants exported with correct default values
- [ ] Structural interfaces: `AILogger` (info/warn/error/debug), `AIEventBus` (publish/subscribe), `AICache` (get/set/del), `AIAbilityChecker` (can)
- [ ] `AI_ERRORS` constant exported with 22 hierarchical error codes in 9 categories (package, provider, resilience, embedding, content, RAG, tool, confirmation, conversation, audit, event)
- [ ] No `any` types
- [ ] All tests pass

---

## Task 2: AIConfig Service

**Priority:** P0 (dependency for provider factory)  
**Estimated time:** 10 min  
**FR:** FR-001, FR-017  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/ai-core.config.ts`

**Test file:** `packages/ai-core/tests/unit/ai-core.config.test.ts`

**Acceptance criteria:**

- [ ] `loadAIConfig()` returns `Result<AIConfig, AppError>` (synchronous)
- [ ] Reads `TEMPOT_AI` env var — `'false'` sets `enabled: false`, anything else = `true`
- [ ] Reads `TEMPOT_AI_PROVIDER` env var — validates against `'gemini' | 'openai'`, defaults to `'gemini'`
- [ ] Returns `err(AppError(AI_ERRORS.PROVIDER_UNKNOWN))` for invalid provider string
- [ ] Reads `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`, `AI_CONFIDENCE_THRESHOLD`, `AI_GENERATION_TIMEOUT_MS`, `AI_EMBEDDING_TIMEOUT_MS` with defaults from `DEFAULT_AI_CONFIG`
- [ ] `loadResilienceConfig()` returns `ResilienceConfig` with env var overrides
- [ ] `loadRateLimitConfig()` returns `RateLimitConfig` with defaults
- [ ] `loadChunkingConfig()` returns `ChunkingConfig` with defaults
- [ ] No `any` types
- [ ] All tests pass (minimum 8 tests: defaults, disabled state, valid gemini, valid openai, invalid provider, embedding model override, dimension override, timeout override)

---

## Task 3: AIProviderFactory

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-001, D8, NFR-004, SC-001  
**Dependencies:** Task 0, Task 1, Task 2

**Files to create:**

- `packages/ai-core/src/provider/ai-provider.factory.ts`

**Test file:** `packages/ai-core/tests/unit/ai-provider.factory.test.ts`

**Acceptance criteria:**

- [ ] `createAIProviderRegistry(config)` returns `Result<ProviderRegistry, AppError>`
- [ ] Uses Vercel AI SDK v6 `createProviderRegistry()` with Google and OpenAI providers (ADR-031)
- [ ] Returns `err(AppError(AI_ERRORS.DISABLED))` when `config.enabled === false`
- [ ] Returns `err(AppError(AI_ERRORS.PROVIDER_AUTH_FAILED))` on provider initialization error
- [ ] `getModelId(config, purpose)` returns correct model ID string for `'chat'` and `'embedding'` purposes
- [ ] Embedding model always uses Google provider regardless of `config.provider` setting
- [ ] Chat model uses `config.provider` to select Google or OpenAI
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: registry creation, disabled returns err, gemini model ID, openai model ID, embedding model ID always google, provider auth error)

---

## Task 4: ResilienceService

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-008, D9, SC-002, NFR-005  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/resilience/resilience.service.ts`

**Test file:** `packages/ai-core/tests/unit/resilience.service.test.ts`

**Acceptance criteria:**

- [ ] `ResilienceService` class takes `ResilienceConfig`, `AILogger`, `AIEventBus` in constructor
- [ ] Uses `cockatiel` library — NOT hand-rolled circuit breaker
- [ ] Circuit breaker: `ConsecutiveBreaker` with configurable threshold (default 5)
- [ ] Circuit breaker: `halfOpenAfter` uses `circuitBreakerResetMs` (default 10 min)
- [ ] On circuit break: logs error via `AILogger`, publishes `system.ai.degraded` event via `AIEventBus`
- [ ] Retry: exponential backoff with `maxAttempts` from config
- [ ] Timeout: configurable per operation type (generation vs. embedding)
- [ ] Bulkhead: limits concurrent AI API calls via `maxConcurrent` from config
- [ ] Policy composition: bulkhead → circuit breaker → retry → timeout
- [ ] `executeGeneration<T>(fn)` returns `AsyncResult<T, AppError>` with full resilience
- [ ] `executeEmbedding<T>(fn)` returns `AsyncResult<T, AppError>` with embedding-specific timeout
- [ ] `isCircuitOpen()` returns boolean reflecting current circuit state
- [ ] Error mapping: circuit breaker errors → `AI_ERRORS.CIRCUIT_OPEN`, timeouts → `AI_ERRORS.PROVIDER_TIMEOUT`, bulkhead → `AI_ERRORS.BULKHEAD_FULL`, others → `AI_ERRORS.PROVIDER_UNAVAILABLE`
- [ ] Circuit breaker activation < 1ms after threshold reached (NFR-005) — benchmark test required
- [ ] No `any` types
- [ ] All tests pass (minimum 10 tests: successful execution, circuit opens after N failures, circuit resets after timeout, retry on transient error, timeout fires, bulkhead rejects excess, degradation event emitted, error mapping for circuit/timeout/bulkhead/unknown, isCircuitOpen state)

---

## Task 5: EmbeddingService

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-002, D11, NFR-002, NFR-003  
**Dependencies:** Task 1, Task 4

**Files to create:**

- `packages/ai-core/src/embedding/embedding.service.ts`

**Test file:** `packages/ai-core/tests/unit/embedding.service.test.ts`

**Acceptance criteria:**

- [ ] `EmbeddingService` extends `DrizzleVectorRepository` from `@tempot/database`
- [ ] Constructor takes database client, `AIConfig`, `ResilienceService`, and provider registry
- [ ] `embedAndStore(input: EmbeddingInput)` returns `AsyncResult<string, AppError>` (returns embedding ID)
- [ ] Formats content with document task prefix: `title: {title} | text: {content}` (D11)
- [ ] Generates embedding via AI SDK `embed()` through `ResilienceService.executeEmbedding()`
- [ ] Stores embedding via parent class `create()` method with `contentId`, `contentType`, `vector`, `metadata`
- [ ] `searchSimilar(options: EmbeddingSearchOptions)` returns `AsyncResult<EmbeddingSearchResult[], AppError>`
- [ ] Formats query with search task prefix: `task: search result | query: {content}` (D11)
- [ ] Filters by `contentType` via `inArray()` — content type filtering happens at query level
- [ ] Applies confidence threshold via `cosine similarity >= threshold`
- [ ] Orders results by cosine similarity descending, limits to `options.limit`
- [ ] `deleteByContentId(contentId)` returns `AsyncResult<void, AppError>` — deletes all embeddings for a content ID
- [ ] Returns `AI_ERRORS.EMBEDDING_FAILED` on embedding generation failure
- [ ] Returns `AI_ERRORS.RAG_SEARCH_FAILED` on search failure
- [ ] Embedding generation < 500ms per text chunk excluding API latency (NFR-002) — benchmark test required
- [ ] Vector similarity search < 100ms for up to 100K embeddings (NFR-003) — benchmark test required
- [ ] No `any` types (except provider registry cast — to be properly typed during implementation)
- [ ] All tests pass (minimum 8 tests: embed and store success, embed failure returns err, search with contentType filter, search with confidence threshold, search empty results, delete by contentId, task prefix formatting for documents, task prefix formatting for queries)

---

## Task 6: RateLimiterService

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-009, D12, SC-006  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/rate-limiter/rate-limiter.service.ts`

**Test file:** `packages/ai-core/tests/unit/rate-limiter.service.test.ts`

**Acceptance criteria:**

- [ ] `RateLimiterService` class takes Redis client and `RateLimitConfig` in constructor
- [ ] Uses `rate-limiter-flexible` `RateLimiterRedis` — NOT custom implementation
- [ ] `consume(userId, role)` returns `AsyncResult<void, AppError>`
- [ ] Returns `ok(undefined)` when under limit
- [ ] Returns `err(AppError(AI_ERRORS.RATE_LIMITED))` when daily limit exceeded
- [ ] Super Admin (`superAdminLimit === 0`) returns `ok(undefined)` always — unlimited
- [ ] Per-role limits: User (20), Admin (50), Super Admin (unlimited) — configurable via `RateLimitConfig`
- [ ] `getRemaining(userId, role)` returns `AsyncResult<number, AppError>` — remaining messages for the day
- [ ] `reset(userId)` returns `AsyncResult<void, AppError>` — Super Admin can reset a user's limit
- [ ] No `any` types
- [ ] All tests pass (minimum 8 tests: consume under limit, consume at limit returns err, super admin unlimited, admin limit, get remaining, get remaining when no consumption, reset, role-based limit selection)

---

## Task 7: AuditService

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-011, D10, NFR-007, SC-004  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/audit/audit.service.ts`

**Test file:** `packages/ai-core/tests/unit/audit.service.test.ts`

**Acceptance criteria:**

- [ ] `AuditService` class takes `AILogger` in constructor
- [ ] Uses `langfuse` `Langfuse` client for AI observability
- [ ] `AIAuditEntry` interface exported: `userId`, `action` (5 types), `input?`, `output?`, `toolName?`, `tokenUsage?`, `latencyMs`, `success`, `errorCode?`, `metadata?`
- [ ] `log(entry: AIAuditEntry)` returns `AsyncResult<void, AppError>` — creates Langfuse trace
- [ ] For `generation` and `tool_call` actions: creates a `generation` span with token usage
- [ ] Fire-and-log pattern: audit failure returns `ok(undefined)` with a warning log — NEVER breaks the calling operation
- [ ] `flush()` returns `AsyncResult<void, AppError>` — flushes pending Langfuse events
- [ ] `shutdown()` returns `AsyncResult<void, AppError>` — gracefully shuts down Langfuse client
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: log generation entry, log tool_call entry, log other action type, log failure returns ok, flush, shutdown)

---

## Task 7b: AICache Middleware

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-019, D8  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/cache/ai-cache.middleware.ts`

**Test file:** `packages/ai-core/tests/unit/ai-cache.middleware.test.ts`

**Acceptance criteria:**

- [ ] `createCacheMiddleware(cache, logger, ttlMs?)` returns `LanguageModelMiddleware` from AI SDK
- [ ] Implements `wrapGenerate` — intercepts model calls with cache check
- [ ] Cache key computed from prompt content hash + tool set hash
- [ ] On cache hit: returns cached result without calling `doGenerate()`, logs debug message
- [ ] On cache miss: calls `doGenerate()`, stores result in cache with TTL
- [ ] Default TTL: 24 hours (86400000 ms), configurable via `ttlMs` parameter
- [ ] Uses structural `AICache` interface — no direct `cache-manager` dependency
- [ ] Uses structural `AILogger` interface for debug logging
- [ ] Hash function uses `crypto.createHash('sha256')` for deterministic cache keys
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: cache miss calls doGenerate, cache hit returns cached, different prompts produce different keys, TTL passed to cache.set, logger.debug called on hit)

---

## Task 8: ContentIngestionService

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-013, D13, Edge Cases (RAG Content Size Limits, PII in Embeddings)  
**Dependencies:** Task 1, Task 5

**Files to create:**

- `packages/ai-core/src/content/content-ingestion.service.ts`

**Test file:** `packages/ai-core/tests/unit/content-ingestion.service.test.ts`

**Acceptance criteria:**

- [ ] `ContentIngestionService` class takes `EmbeddingService`, `ChunkingConfig`, `AILogger`, `AIEventBus` in constructor
- [ ] `ingest(contentId, contentType, content, metadata?, source?)` returns `AsyncResult<number, AppError>` — number of chunks stored
- [ ] Validates content size against `maxDocumentBytes` — returns `err(AppError(AI_ERRORS.CONTENT_SIZE_EXCEEDED))` when exceeded
- [ ] Sanitizes PII before embedding: phone numbers → `[PHONE]`, emails → `[EMAIL]`, national IDs (14 digits) → `[NATIONAL_ID]`
- [ ] Chunks content using word-based splitting with configurable `chunkSizeTokens` and `overlapTokens`
- [ ] Deletes existing embeddings for `contentId` before re-indexing
- [ ] Embeds and stores each chunk with `chunkIndex` and `totalChunks` in metadata
- [ ] Best-effort chunking: failed chunks are logged and skipped, not fatal
- [ ] Emits `ai-core.content.indexed` event with `contentId`, `contentType`, `chunkCount`, `source` via fire-and-log
- [ ] `chunkContent(text, metadata)` is testable independently — returns `ContentChunk[]`
- [ ] `sanitizePII(content)` is testable independently — returns sanitized string
- [ ] No `any` types
- [ ] All tests pass (minimum 10 tests: ingest success, size exceeded, PII phone removed, PII email removed, PII national ID removed, chunking with overlap, single chunk for small content, re-indexing deletes old embeddings, failed chunk skipped, event emitted)

---

## Task 9: RAGPipeline

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-005, D5, Edge Cases (Model Hallucination Prevention, Unauthorized Data Access via RAG), SC-003  
**Dependencies:** Task 1, Task 5

**Files to create:**

- `packages/ai-core/src/rag/rag-pipeline.service.ts`

**Test file:** `packages/ai-core/tests/unit/rag-pipeline.service.test.ts`

**Acceptance criteria:**

- [ ] `RAGPipeline` class takes `EmbeddingService` in constructor
- [ ] `RAGContext` interface exported: `hasResults`, `context` (string), `sources` (EmbeddingSearchResult[])
- [ ] `CONTENT_TYPE_ACCESS` access control matrix matches spec (D5): `ui-guide` → User/Admin/SuperAdmin, `bot-functions` → Admin/SuperAdmin, `db-schema` → SuperAdmin, `developer-docs` → Developer/SuperAdmin, `custom-knowledge` → per-content, `user-memory` → per-user
- [ ] `retrieve(query, userRole, userId, confidenceThreshold?)` returns `AsyncResult<RAGContext, AppError>`
- [ ] Determines accessible content types based on user role BEFORE vector search
- [ ] Searches embeddings via `EmbeddingService.searchSimilar()` with filtered content types
- [ ] Post-filters `user-memory` results to only the requesting user's memories (by `userId` in metadata)
- [ ] Post-filters `custom-knowledge` results by `accessRoles` in metadata
- [ ] Returns `{ hasResults: false, context: '', sources: [] }` when no results pass all filters
- [ ] Builds context string from results with `[contentType] title: (score: X.XX)` format
- [ ] `user-memory` and `custom-knowledge` are always included in the query (filtered in post-processing)
- [ ] No `any` types
- [ ] All tests pass (minimum 10 tests: user role gets ui-guide only, admin gets ui-guide+bot-functions, super admin gets all, user-memory filtered by userId, custom-knowledge filtered by accessRoles, no results returns hasResults=false, confidence threshold applied, context string formatted correctly, developer role gets developer-docs, empty accessible types returns empty)

---

## Task 10: ToolRegistry

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-003, D3, Edge Cases (Module Tool Versioning)  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/tools/tool-registry.ts`

**Test file:** `packages/ai-core/tests/unit/tool-registry.test.ts`

**Acceptance criteria:**

- [ ] `ToolRegistry` class takes `AILogger` and `AIEventBus` in constructor
- [ ] Subscribes to `module.tools.registered` event in constructor for automatic tool discovery
- [ ] `register(tool: AITool)` stores tool by name in internal `Map<string, AITool>`
- [ ] Version update: when re-registering a tool with different version, logs info with old/new versions
- [ ] `getAll()` returns `AITool[]` — all registered tools
- [ ] `get(name)` returns `AITool | undefined` — lookup by name
- [ ] Event handler: parses `module.tools.registered` payload and registers each tool
- [ ] Gracefully handles malformed event payloads (no crash)
- [ ] No `any` types
- [ ] All tests pass (minimum 7 tests: register tool, get by name, get all, re-register with new version logs, event-driven registration, get non-existent returns undefined, malformed event payload handled)

---

## Task 11: CASLToolFilter

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-004, D4, SC-005  
**Dependencies:** Task 1, Task 10

**Files to create:**

- `packages/ai-core/src/tools/casl-tool-filter.ts`

**Test file:** `packages/ai-core/tests/unit/casl-tool-filter.test.ts`

**Acceptance criteria:**

- [ ] `CASLToolFilter` class takes `ToolRegistry` in constructor
- [ ] `filterForUser(abilityChecker: AIAbilityChecker)` returns `AITool[]` — only permitted tools
- [ ] Calls `abilityChecker.can(tool.requiredPermission.action, tool.requiredPermission.subject)` for each tool
- [ ] Tools where `can()` returns `false` are excluded — model never sees them (D4, SC-005)
- [ ] Returns empty array when no tools are permitted
- [ ] Returns all tools when all are permitted
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: filters out unauthorized tools, includes authorized tools, empty registry returns empty, all permitted returns all, none permitted returns empty)

---

## Task 12: RoleSystemPrompts

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-012, FR-018, D1  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/prompts/role-system-prompts.ts`

**Test file:** `packages/ai-core/tests/unit/role-system-prompts.test.ts`

**Acceptance criteria:**

- [ ] `getSystemPrompt(role, language)` returns the i18n key for the role's system prompt
- [ ] Maps `super_admin` → `ai-core.system_prompt.super_admin`
- [ ] Maps `admin` → `ai-core.system_prompt.admin`
- [ ] Maps `user` → `ai-core.system_prompt.user`
- [ ] Falls back to `user` prompt for unknown roles
- [ ] System prompts constrain the model to bot-related tasks only (D1: AI as bot tool, not chatbot)
- [ ] Actual prompt text lives in i18n locale files — this module returns keys only
- [ ] All AI responses use user's configured language via i18n (FR-018) — Arabic primary, English secondary
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: super admin prompt, admin prompt, user prompt, unknown role defaults to user)

---

## Task 13: ConfirmationEngine

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-007, D6, Rule LXVII, Edge Cases (Write Action Confirmation Timeout)  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/ai-core/src/confirmation/confirmation.engine.ts`

**Test file:** `packages/ai-core/tests/unit/confirmation.engine.test.ts`

**Acceptance criteria:**

- [ ] `PendingConfirmation` interface exported: `id`, `userId`, `toolName`, `params`, `level`, `summary`, `details?`, `confirmationCode?`, `createdAt`, `expiresAt`
- [ ] `ConfirmationEngine` class uses in-memory `Map<string, PendingConfirmation>` for pending confirmations
- [ ] `createConfirmation(userId, toolName, params, level, summary, details?)` returns `Result<PendingConfirmation, AppError>`
- [ ] Generates UUID for confirmation ID
- [ ] Generates 6-digit confirmation code for `escalated` level only
- [ ] Sets `expiresAt` to `createdAt + 5 minutes` (Rule LXVII)
- [ ] Cleans expired confirmations before creating new ones
- [ ] `confirm(confirmationId, userId, code?)` returns `Result<PendingConfirmation, AppError>`
- [ ] Returns `err(AI_ERRORS.CONFIRMATION_EXPIRED)` when confirmation not found or expired
- [ ] Returns `err(AI_ERRORS.CONFIRMATION_REJECTED)` when `userId` doesn't match
- [ ] Returns `err(AI_ERRORS.CONFIRMATION_CODE_INVALID)` when escalated code is wrong
- [ ] Removes confirmation from map after successful confirm
- [ ] `cancel(confirmationId, userId)` returns `Result<void, AppError>` — removes from map
- [ ] No `any` types
- [ ] All tests pass (minimum 10 tests: create simple, create detailed, create escalated with code, confirm simple, confirm escalated with correct code, confirm expired returns err, confirm wrong user rejected, confirm wrong code rejected, cancel success, cancel wrong user rejected)

---

## Task 14: IntentRouter

**Priority:** P1  
**Estimated time:** 20 min  
**FR:** FR-006, D8, Edge Cases (Failed Intent / Ambiguous Query, AI Provider Safety Filter Refusal)  
**Dependencies:** Task 1, Task 4, Task 9, Task 11, Task 13, Task 7

**Files to create:**

- `packages/ai-core/src/router/intent-router.ts`

**Test file:** `packages/ai-core/tests/unit/intent-router.test.ts`

**Acceptance criteria:**

- [ ] `IntentResult` interface exported: `response`, `toolsCalled`, `tokenUsage`, `requiresConfirmation?`
- [ ] `IntentRouter` class takes provider registry, modelId, `ResilienceService`, `CASLToolFilter`, `ConfirmationEngine`, `RAGPipeline`, `AuditService`, `AILogger` in constructor
- [ ] `route(message, userId, userRole, abilityChecker, systemPrompt, conversationHistory)` returns `AsyncResult<IntentResult, AppError>`
- [ ] Filters tools via `CASLToolFilter.filterForUser(abilityChecker)` before model call
- [ ] Retrieves RAG context via `RAGPipeline.retrieve()` and injects into system prompt
- [ ] Builds messages array: system prompt (with RAG context) → conversation history → current message
- [ ] Converts `AITool[]` to AI SDK tool format for `generateText()`
- [ ] Calls `generateText()` with `maxSteps: 5` for multi-step agent loops
- [ ] Wraps model call in `ResilienceService.executeGeneration()`
- [ ] Logs every interaction via `AuditService.log()` with fire-and-log pattern
- [ ] Returns `IntentResult` with response text, called tool names, and token usage
- [ ] AI response latency < 5s for intent routing excluding external API latency (NFR-001) — benchmark test required
- [ ] No `any` types (except provider registry cast — to be properly typed during implementation)
- [ ] All tests pass (minimum 8 tests: successful routing with tools, routing with RAG context, no tools available, resilience failure returns err, audit logging called, tool execution in result, empty conversation history, multiple tools called)

---

## Task 15: ConversationMemory

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-010, D7, SC-007, Edge Cases (Concurrent AI Sessions)  
**Dependencies:** Task 1, Task 4, Task 5

**Files to create:**

- `packages/ai-core/src/memory/conversation-memory.service.ts`

**Test file:** `packages/ai-core/tests/unit/conversation-memory.test.ts`

**Acceptance criteria:**

- [ ] `ConversationMemory` class takes `EmbeddingService`, `ResilienceService`, provider registry, modelId, `AILogger`, `AIEventBus` in constructor
- [ ] `summarizeAndStore(userId, sessionId, conversation)` returns `AsyncResult<void, AppError>`
- [ ] Empty conversation returns `ok(undefined)` immediately
- [ ] Generates summary via `generateText()` with summarization prompt, wrapped in `ResilienceService.executeGeneration()`
- [ ] Embeds summary via `EmbeddingService.embedAndStore()` with `contentType: 'user-memory'`, `userId` and `sessionId` in metadata
- [ ] Emits `ai-core.conversation.ended` event via fire-and-log pattern
- [ ] Returns `err(AI_ERRORS.SUMMARIZATION_FAILED)` on summarization or embedding failure
- [ ] Conversation summarization < 3s per session excluding API latency (NFR-006) — benchmark test required
- [ ] `retrievePastContext(userId, currentQuery, limit?)` returns `AsyncResult<string[], AppError>`
- [ ] Retrieves past summaries via `EmbeddingService.searchSimilar()` with `contentType: 'user-memory'`
- [ ] Uses lower confidence threshold (0.5) for memory recall
- [ ] Filters results to only the requesting user's memories (by `userId` in metadata)
- [ ] Returns content IDs of matching memories
- [ ] Conversation memory retrieves relevant past context in new sessions — semantic search recall > 70% (SC-007)
- [ ] No `any` types
- [ ] All tests pass (minimum 7 tests: summarize and store success, empty conversation skipped, summarization failure, embedding failure, retrieve past context, user isolation in retrieval, event emitted)

---

## Task 16: AlternativeSuggestions

**Priority:** P2  
**Estimated time:** 5 min  
**FR:** FR-014, Edge Cases (Failed Intent / Ambiguous Query)  
**Dependencies:** Task 0, Task 1, Task 10

**Files to create:**

- `packages/ai-core/src/suggestions/alternative-suggestions.ts`

**Test file:** `packages/ai-core/tests/unit/alternative-suggestions.test.ts`

**Acceptance criteria:**

- [ ] `AlternativeSuggestions` class takes `ToolRegistry` in constructor
- [ ] `suggest(userMessage, filteredTools, maxSuggestions?)` returns `string[]` — up to 3 tool descriptions
- [ ] Keyword-based matching: scores tools by word overlap between user message and tool description/name
- [ ] Higher weight for name matches than description matches
- [ ] Sorts by score descending, returns top N
- [ ] Returns empty array when no tools match
- [ ] Default `maxSuggestions` is 3
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: matching suggestions returned, max enforced, empty when no match, score ordering, name match weighted higher)

---

## Task 17: TelegramAssistantUI

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-015, D2, Edge Cases (Concurrent AI Sessions)  
**Dependencies:** Task 6, Task 14, Task 15, Task 13

**Files to create:**

- `packages/ai-core/src/ui/telegram-assistant-ui.ts`

**Test file:** `packages/ai-core/tests/unit/telegram-assistant-ui.test.ts`

**Acceptance criteria:**

- [ ] `TelegramAssistantDeps` interface exported grouping dependencies: `intentRouter`, `rateLimiter`, `conversationMemory`, `confirmationEngine`
- [ ] Orchestrates AI conversation flow: rate limit check → session management → intent routing → response → confirmation handling
- [ ] Integrates with grammY conversation API for multi-turn interaction
- [ ] Supports `/ai` command and inline button for entering conversation mode (D2)
- [ ] One active AI conversation per user — starting new session ends previous (Edge Case: Concurrent AI Sessions)
- [ ] Rate limit checked before each message
- [ ] Session end triggers conversation summarization via `ConversationMemory`
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: conversation flow orchestration, rate limit rejection, session end summarization, confirmation flow, dependency injection)

---

## Task 18: Developer RAG and CLI Tools

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-016  
**Dependencies:** Task 3, Task 5, Task 9

**Files to create:**

- `packages/ai-core/src/cli/dev-assistant.ts`
- `packages/ai-core/src/cli/module-reviewer.ts`

**Test file:** `packages/ai-core/tests/unit/dev-assistant.test.ts`

**Acceptance criteria:**

- [ ] `pnpm ai:dev "question"` handler queries `developer-docs` content type via RAGPipeline
- [ ] `pnpm ai:review --module {name}` handler checks module.config.ts completeness, discovers missing events, reviews UX compliance, checks i18n completeness, suggests test cases
- [ ] Both CLI tools reuse `AIProviderFactory`, `EmbeddingService`, and `RAGPipeline` — no duplicate infrastructure
- [ ] CLI tools run outside Telegram context — no grammY dependency
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: dev question with results, dev question with no results, module review with issues, module review clean)

---

## Task 19: Event Registration

**Priority:** P1 (cross-package modification)  
**Estimated time:** 5 min  
**FR:** Spec § Event Payloads  
**Dependencies:** Task 1

**Files to modify:**

- `packages/event-bus/src/event-bus.events.ts`

**Test file:** N/A (type-level change — validated by TypeScript compilation)

**Acceptance criteria:**

- [ ] `TempotEvents` interface updated with `'system.ai.degraded'` event with inline payload: `reason`, `failureCount`, `disabledUntil: Date`, `lastError`
- [ ] `TempotEvents` interface updated with `'ai-core.tool.executed'` event with inline payload: `userId`, `toolName`, `success`, `executionMs`, `tokenUsage`
- [ ] `TempotEvents` interface updated with `'ai-core.conversation.ended'` event with inline payload: `userId`, `messageCount`, `summarized`, `durationMs`
- [ ] `TempotEvents` interface updated with `'ai-core.content.indexed'` event with inline payload: `contentId`, `contentType`, `chunkCount`, `source`
- [ ] `TempotEvents` interface updated with `'module.tools.registered'` event with inline payload: `moduleName`, `toolCount`, `toolNames: string[]`
- [ ] Payload types defined **inline** in event-bus.events.ts — do NOT import from `@tempot/ai-core` (avoids circular dependency)
- [ ] No other files in `packages/event-bus/` are modified
- [ ] TypeScript compilation passes with no errors

---

## Task 20: Cross-Package Modifications

**Priority:** P1 (cross-package modification)  
**Estimated time:** 5 min  
**FR:** Spec § Cross-Package Modifications  
**Dependencies:** Task 0

**Files to modify:**

- `packages/database/src/database.config.ts`

**Test file:** N/A (configuration change — validated by compilation and existing tests)

**Acceptance criteria:**

- [ ] `VECTOR_DIMENSIONS` default updated from 768 to 3072
- [ ] `packages/database/src/drizzle/drizzle.schema.ts` confirmed to use `DB_CONFIG.VECTOR_DIMENSIONS` (already does — no change needed)
- [ ] No other files in `packages/database/` are modified
- [ ] All existing database tests continue to pass

---

## Task 21: Barrel Exports (`src/index.ts`)

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** All (final integration)  
**Dependencies:** All Tasks 1–18

**Files to update:**

- `packages/ai-core/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [ ] Exports all types: `AIProviderType`, `AIContentType`, `ConfirmationLevel`, `AIDegradationMode`, `AIConfig`, `ResilienceConfig`, `RateLimitConfig`, `ChunkingConfig`, `AITool`, `AISession`, `EmbeddingInput`, `EmbeddingSearchOptions`, `EmbeddingSearchResult`, `ContentChunk`
- [ ] Exports all default configs: `DEFAULT_AI_CONFIG`, `DEFAULT_RESILIENCE_CONFIG`, `DEFAULT_RATE_LIMIT_CONFIG`, `DEFAULT_CHUNKING_CONFIG`
- [ ] Exports structural interfaces: `AILogger`, `AIEventBus`, `AICache`, `AIAbilityChecker`
- [ ] Exports `AI_ERRORS` constant
- [ ] Exports config functions: `loadAIConfig`, `loadResilienceConfig`, `loadRateLimitConfig`, `loadChunkingConfig`
- [ ] Exports factory: `createAIProviderRegistry`, `getModelId`
- [ ] Exports services: `ResilienceService`, `EmbeddingService`, `RateLimiterService`, `AuditService`, `ContentIngestionService`, `RAGPipeline`, `ToolRegistry`, `CASLToolFilter`, `ConfirmationEngine`, `IntentRouter`, `ConversationMemory`, `AlternativeSuggestions`
- [ ] Exports middleware: `createCacheMiddleware`
- [ ] Exports guard: `guardEnabled`
- [ ] Exports UI types: `TelegramAssistantDeps`
- [ ] Exports audit types: `AIAuditEntry`
- [ ] Exports RAG types: `RAGContext`
- [ ] Exports confirmation types: `PendingConfirmation`
- [ ] Exports intent types: `IntentResult`
- [ ] All relative imports use `.js` extensions (ESM/NodeNext compliance)
- [ ] All existing tests still pass after barrel update
- [ ] 10-point package-creation-checklist passes final verification
- [ ] No `any` types in any file across the package
- [ ] No `console.*` in any file across the package

---

## Task 22: Pluggable Architecture Toggle (Rule XVI)

**Priority:** P0  
**Estimated time:** 10 min  
**FR:** FR-017  
**Dependencies:** Task 1, Task 2

**Files to create:**

- `packages/ai-core/src/ai-core.guard.ts`

**Test file:** `packages/ai-core/tests/unit/ai-core.guard.test.ts`

**Acceptance criteria:**

- [ ] `guardEnabled<T>(enabled, fn)` function exported
- [ ] When `enabled === false`: returns `err(AppError(AI_ERRORS.DISABLED))` without calling `fn`
- [ ] When `enabled === true`: calls and returns `fn()` result
- [ ] Each public service method uses `guardEnabled(this.config.enabled, () => ...)` pattern
- [ ] Document the disable behavior in README
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: enabled calls fn, disabled returns err without calling fn, fn error propagated, disabled does not initialize provider)

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  ├─→ Task 1 (types/contracts/errors)
  │     ├─→ Task 2 (AIConfig)                    ─┐
  │     │     └─→ Task 3 (AIProviderFactory)      ─┤
  │     │     └─→ Task 22 (Pluggable Toggle)      │
  │     ├─→ Task 4 (ResilienceService)            ─┤
  │     ├─→ Task 5 (EmbeddingService)  ←── T4     ─┤── Phase 1A
  │     ├─→ Task 6 (RateLimiterService)           ─┤
  │     ├─→ Task 7 (AuditService)                 ─┤
  │     ├─→ Task 7b (AICache Middleware)          ─┘
  │     │
  │     ├─→ Task 8 (ContentIngestionService) ←── T5  ─┐
  │     ├─→ Task 9 (RAGPipeline) ←── T5              ─┤
  │     ├─→ Task 10 (ToolRegistry)                    ─┤
  │     │     └─→ Task 11 (CASLToolFilter) ←── T10    ─┤── Phase 1B
  │     ├─→ Task 12 (RoleSystemPrompts)               ─┤
  │     ├─→ Task 13 (ConfirmationEngine)              ─┤
  │     └─→ Task 14 (IntentRouter) ←── T4,T9,T11,T13,T7 ─┘
  │
  │     ├─→ Task 15 (ConversationMemory) ←── T4,T5    ─┐
  │     ├─→ Task 16 (AlternativeSuggestions) ←── T10  ─┤── Phase 1C
  │     ├─→ Task 17 (TelegramAssistantUI) ←── T6,T14,T15,T13 ─┤
  │     └─→ Task 18 (Developer CLI) ←── T3,T5,T9     ─┘
  │
  ├─→ Task 19 (event registration — cross-package)
  ├─→ Task 20 (database dimension — cross-package)
  │
  └───────── All tasks ─→ Task 21 (barrel exports)
```

---

## Summary

| Task  | Name                    | Priority | Est. Time   | Phase | FR Coverage                  |
| ----- | ----------------------- | -------- | ----------- | ----- | ---------------------------- |
| 0     | Package Scaffolding     | P0       | 5 min       | 1A    | Infrastructure               |
| 1     | Types/Contracts/Errors  | P0       | 15 min      | 1A    | FR-001,003,008,009,017,019   |
| 2     | AIConfig Service        | P0       | 10 min      | 1A    | FR-001, FR-017               |
| 3     | AIProviderFactory       | P1       | 10 min      | 1A    | FR-001, D8, NFR-004, SC-001  |
| 4     | ResilienceService       | P1       | 15 min      | 1A    | FR-008, D9, SC-002, NFR-005  |
| 5     | EmbeddingService        | P1       | 15 min      | 1A    | FR-002, D11, NFR-002,003     |
| 6     | RateLimiterService      | P1       | 10 min      | 1A    | FR-009, D12, SC-006          |
| 7     | AuditService            | P1       | 10 min      | 1A    | FR-011, D10, NFR-007, SC-004 |
| 7b    | AICache Middleware      | P1       | 10 min      | 1A    | FR-019, D8                   |
| 8     | ContentIngestionService | P1       | 15 min      | 1B    | FR-013, D13                  |
| 9     | RAGPipeline             | P1       | 15 min      | 1B    | FR-005, D5, SC-003           |
| 10    | ToolRegistry            | P1       | 10 min      | 1B    | FR-003, D3                   |
| 11    | CASLToolFilter          | P1       | 5 min       | 1B    | FR-004, D4, SC-005           |
| 12    | RoleSystemPrompts       | P1       | 5 min       | 1B    | FR-012, D1                   |
| 13    | ConfirmationEngine      | P1       | 15 min      | 1B    | FR-007, D6, Rule LXVII       |
| 14    | IntentRouter            | P1       | 20 min      | 1B    | FR-006, D8                   |
| 15    | ConversationMemory      | P2       | 15 min      | 1C    | FR-010, D7                   |
| 16    | AlternativeSuggestions  | P2       | 5 min       | 1C    | FR-014                       |
| 17    | TelegramAssistantUI     | P2       | 15 min      | 1C    | FR-015, D2                   |
| 18    | Developer CLI           | P2       | 15 min      | 1C    | FR-016                       |
| 19    | Event Registration      | P1       | 5 min       | X-pkg | Spec § Events                |
| 20    | Database Dimensions     | P1       | 5 min       | X-pkg | Spec § Cross-Package         |
| 21    | Barrel Exports          | P1       | 5 min       | Final | All                          |
| 22    | Pluggable Toggle        | P0       | 10 min      | 1A    | FR-017, Rule XVI             |
| **—** | **Total**               |          | **250 min** |       |                              |
