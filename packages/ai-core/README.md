# @tempot/ai-core

> Vercel AI SDK abstraction layer. Gemini is the default provider — swap to OpenAI via configuration.

## Purpose

Provider-agnostic AI capabilities behind a unified interface:

- `ai-provider.factory` — pluggable provider registry (Gemini default, OpenAI alternative)
- `resilience.service` — circuit breaker + retry + timeout + bulkhead via cockatiel
- `rate-limiter.service` — per-role rate limiting via rate-limiter-flexible + Redis
- `embedding.service` — embed and search vectors via Drizzle + pgvector (3072-dim, halfvec HNSW)
- `rag-pipeline.service` — role-based RAG with content type access matrix and post-filtering
- `retrieval-plan.validation` — public retrieval planning and grounded answer state contracts
- RAG evaluation fixtures — deterministic test-only retrieval, citation, leakage, and no-context scoring cases
- `intent.router` — multi-step agentic generation with tool use, CASL filtering, and confirmation gates
- `confirmation.engine` — 5-minute TTL pending confirmations with 6-digit codes (Rule LXVII)
- `audit.service` — fire-and-log pattern for AI action auditing
- `content-ingestion.service` — chunk documents and store embeddings with text metadata
- `conversation-memory.service` — summarize and store session memories
- `dev.assistant` — RAG-powered developer Q&A CLI tool
- `module.reviewer` — RAG-powered module review CLI tool
- Toggle guard — enabled by default (`AIConfig.enabled = true`), disable via `TEMPOT_AI=false`

## Phase

Phase 1 — Core Infrastructure

## Dependencies

| Package                     | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `ai` 6.x (Vercel AI SDK)    | Provider-agnostic abstraction — ADR-016, ADR-037      |
| `@ai-sdk/google`            | Gemini adapter (default provider)                     |
| `@ai-sdk/openai`            | OpenAI adapter (alternative provider)                 |
| `drizzle-orm`               | pgvector storage and similarity search                |
| `cockatiel` 3.x             | Circuit breaker, retry, timeout, bulkhead             |
| `rate-limiter-flexible` 5.x | Per-role rate limiting with Redis backend             |
| `langfuse`                  | AI observability (optional)                           |
| `@tempot/shared`            | Result types, AppError, AsyncResult                   |
| `@tempot/database`          | DrizzleVectorRepository, embeddings table, DB_CONFIG  |
| `@tempot/event-bus`         | AI event types (generation, embedding, failure, etc.) |
| `@tempot/logger`            | Pino logger interface                                 |

## Provider Configuration

```env
TEMPOT_AI=true
TEMPOT_AI_PROVIDER=gemini          # gemini | openai
AI_EMBEDDING_MODEL=gemini-embedding-2-preview
AI_EMBEDDING_DIMENSIONS=3072
GEMINI_API_KEY=AIza...
```

Provider switching is configuration-only through `TEMPOT_AI_PROVIDER`. The
package defaults to Gemini when the variable is omitted.

## API

```typescript
import {
  AIProviderFactory,
  ResilienceService,
  EmbeddingService,
  RAGPipeline,
  IntentRouter,
  ConfirmationEngine,
  TelegramAssistantUI,
  buildAnswerState,
  validateRetrievalPlan,
} from '@tempot/ai-core';

// Create provider registry
const registry = AIProviderFactory.create({ provider: 'gemini' });

// Embed content
const result = await embeddingService.embedAndStore({
  contentId: 'doc-1',
  contentType: 'ui-guide',
  content: 'Dashboard usage guide',
  metadata: { title: 'Dashboard Guide' },
});

// Search similar content
const searchResult = await embeddingService.searchSimilar({
  query: 'how to use dashboard',
  contentTypes: ['ui-guide'],
  limit: 5,
});

// Execute the Spec #031 RAG runtime path with retrieval-plan wiring
const pipeline = new RAGPipeline({ embeddingService, auditService });
const retrievalResult = await pipeline.retrieveWithPlan({
  requestId: 'request-1',
  queryText: 'reset password',
  locale: 'en',
  allowedContentTypes: ['ui-guide', 'user-memory', 'custom-knowledge'],
  userScope: { userId: 'user-1', role: 'admin' },
  maxResults: 5,
  confidenceThreshold: 0.7,
});

if (retrievalResult.isOk()) {
  const answerState = buildAnswerState(retrievalResult.value);
}

// Validate retrieval plan contracts before execution
const planResult = validateRetrievalPlan({
  planId: 'plan-1',
  requestId: 'request-1',
  createdAt: new Date().toISOString(),
  policy: { allowDegradedContext: false, requireAccessFilter: true },
  steps: [
    {
      id: 'vector',
      kind: 'vector',
      outputRef: 'candidates',
      required: true,
      params: { limit: 20 },
    },
    {
      id: 'access',
      kind: 'access-filter',
      inputRefs: ['candidates'],
      outputRef: 'authorized',
      required: true,
      params: { policy: 'current-user' },
    },
  ],
});
```

## Degradation Modes

| Component            | Behaviour                                                          |
| -------------------- | ------------------------------------------------------------------ |
| `guardEnabled`       | Returns `err(DISABLED)` when AI feature toggle is off              |
| `ResilienceService`  | Circuit breaker opens after threshold failures, auto-recovers      |
| `RAGPipeline`        | Graceful degradation — continues without context on search failure |
| `RateLimiterService` | Super Admin = unlimited; per-role limits with Redis backend        |

## ADRs

- ADR-016 — Vercel AI SDK for provider abstraction
- ADR-017 — Drizzle ORM for pgvector
- ADR-037 — Vercel AI SDK v6 upgrade

## Status

Complete baseline and active RAG contract expansion on 2026-05-05.

- 36 source files under `src/`
- 30 unit test files under `tests/unit/`
- Public exports are maintained through `src/index.ts`
