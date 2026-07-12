# @tempot/ai-core

> Vercel AI SDK abstraction layer for Tempot AI foundations. Gemini is the
> default chat provider; OpenAI can be selected for chat through configuration.

## Purpose

`@tempot/ai-core` provides provider-agnostic AI foundation capabilities behind a
unified Tempot package boundary:

- `ai-provider.factory`: pluggable provider registry for Gemini and OpenAI chat
  providers.
- `resilience.service`: circuit breaker, retry, timeout, and bulkhead behavior
  via cockatiel.
- `rate-limiter.service`: per-role rate limiting via rate-limiter-flexible.
- `embedding.service`: embedding storage and similarity search through Drizzle
  and pgvector.
- `rag-pipeline.service`: role-aware RAG retrieval with content-type access
  filtering.
- `retrieval-plan.validation`: retrieval planning and grounded answer-state
  contracts.
- RAG evaluation fixtures: deterministic test-only retrieval, citation,
  leakage, and no-context scoring cases.
- `intent.router`: multi-step generation with tool use, CASL filtering, and
  confirmation gates.
- `confirmation.engine`: pending confirmations with TTL and escalated codes.
- `audit.service`: fire-and-log AI action auditing.
- `content-ingestion.service`: document chunking and embedding ingestion.
- `conversation-memory.service`: conversation summary storage.
- `dev.assistant`: developer Q&A service class for future CLI wiring.
- `module.reviewer`: module review service class for future CLI wiring.
- Toggle guard: enabled by default and disabled with `TEMPOT_AI=false`.

This package is implemented as a foundation package. It is not yet wired as a
user-facing Telegram bot AI/RAG flow in the current runtime.

## Phase

Phase 1 - Core Infrastructure.

Runtime activation is tracked in:

- `docs/architecture/ai-rag-runtime-activation-plan.md`

## Dependencies

| Package | Purpose |
| --- | --- |
| `ai` 6.x | Vercel AI SDK provider abstraction |
| `@ai-sdk/google` | Gemini adapter |
| `@ai-sdk/openai` | OpenAI adapter |
| `drizzle-orm` | pgvector storage and similarity search |
| `cockatiel` 3.x | Circuit breaker, retry, timeout, and bulkhead |
| `rate-limiter-flexible` 5.x | Per-role rate limiting |
| `langfuse` | Optional AI observability |
| `@tempot/shared` | Result types, `AppError`, and `AsyncResult` |
| `@tempot/database` | `DrizzleVectorRepository`, embeddings table, and DB config |
| `@tempot/event-bus` | AI event payload types |
| `@tempot/logger` | Pino logger interface |

## Provider Configuration

```env
TEMPOT_AI=true
TEMPOT_AI_PROVIDER=gemini
AI_EMBEDDING_MODEL=gemini-embedding-2-preview
AI_EMBEDDING_DIMENSIONS=3072
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```

`TEMPOT_AI_PROVIDER` selects the chat provider. The package defaults to Gemini
when the variable is omitted.

Embedding generation currently uses `AI_EMBEDDING_MODEL`, with
`gemini-embedding-2-preview` as the default. Embedding-provider changes require
re-indexing because vectors from different providers are not compatible.

## API

```typescript
import {
  AIProviderFactory,
  EmbeddingService,
  RAGPipeline,
  buildAnswerState,
  validateRetrievalPlan,
} from '@tempot/ai-core';

const registry = AIProviderFactory.create({ provider: 'gemini' });

const result = await embeddingService.embedAndStore({
  contentId: 'doc-1',
  contentType: 'ui-guide',
  content: 'Dashboard usage guide',
  metadata: { title: 'Dashboard Guide' },
});

const searchResult = await embeddingService.searchSimilar({
  query: 'how to use dashboard',
  contentTypes: ['ui-guide'],
  limit: 5,
});

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

## Operational Status

| Capability | Current status |
| --- | --- |
| Provider configuration | Implemented for chat provider selection |
| Embedding service | Implemented against Drizzle pgvector storage |
| Content ingestion service | Implemented as a package service |
| RAG runtime selection | Implemented through `retrieveWithPlan()` |
| Answer-state contracts | Implemented through `buildAnswerState()` |
| Evaluation fixtures | Implemented as deterministic test-only fixtures |
| Telegram bot AI flow | Not activated in the current bot runtime |
| Root `pnpm ai:dev` script | Not currently exposed |
| Root `pnpm ai:review` script | Not currently exposed |
| Docs ingestion CLI | Partial: reusable ingestion functions exist; live dependency composition is pending |

## Degradation Modes

| Component | Behaviour |
| --- | --- |
| `guardEnabled` | Returns `err(DISABLED)` when AI feature toggle is off |
| `ResilienceService` | Circuit breaker opens after threshold failures and auto-recovers |
| `RAGPipeline` | Graceful degradation for supported retrieval failure paths |
| `RateLimiterService` | Super Admin unlimited; per-role limits for other roles |

## ADRs

- ADR-016: Vercel AI SDK for provider abstraction.
- ADR-017: Drizzle ORM for pgvector.
- ADR-037: Vercel AI SDK v6 upgrade.

## Status

Complete foundation baseline and RAG contract expansion as of 2026-05-05.
Runtime activation remains pending until a bot module opts in with `hasAI: true`,
defines `aiDegradationMode`, and uses the RAG service from a governed runtime
composition point.

- 36 source files under `src/`.
- 30 unit test files under `tests/unit/`.
- Public exports are maintained through `src/index.ts`.
