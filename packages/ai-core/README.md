# @tempot/ai-core

> Vercel AI SDK abstraction layer. Gemini is the default provider — swap to OpenAI or others via `.env`.

## Purpose

Provider-agnostic AI capabilities behind a unified interface:

- `embedding` — store and search vectors via Drizzle + pgvector
- `classifier` — categorise text or files
- `extractor` — extract structured data from free-form text/voice
- `summarizer` — summarise long content
- `validator` — AI-powered input validation
- `translator` — dynamic translation
- `generator` — structured content generation
- Circuit breaker — disables AI for 10 minutes after 5 consecutive failures
- BullMQ queue for non-urgent batch embedding (50% cost saving)

Disabled by default. Enable with `TEMPOT_AI=true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package | Purpose |
|---------|---------|
| `ai` 4.x (Vercel AI SDK) | Provider-agnostic abstraction — ADR-016 |
| `@ai-sdk/google` | Gemini adapter |
| `drizzle-orm` | pgvector storage and similarity search |
| `@tempot/shared` | cache-manager (cache AI results), queue factory |
| `@tempot/database` | Drizzle connection |
| `@tempot/logger` | Failure + circuit breaker logging |

## Provider Configuration

```env
AI_PROVIDER=gemini          # gemini | openai | cohere
AI_EMBEDDING_MODEL=gemini-embedding-2-preview
AI_EMBEDDING_DIMENSIONS=1536
GEMINI_API_KEY=AIza...
```

> ⚠️ Changing `AI_PROVIDER` or `AI_EMBEDDING_MODEL` requires full re-indexing. See `docs/architecture/AI-REINDEXING-STRATEGY.md`.

## API

```typescript
import { aiCore } from '@tempot/ai-core';

// Embedding + semantic search
await aiCore.embed({ contentId: 'inv-123', contentType: 'invoice', text: 'invoice content' });
const results = await aiCore.search({ query: 'فاتورة أحمد', contentType: 'invoice', limit: 10 });

// Extraction (used by Input Engine AIExtractorField)
const extracted = await aiCore.extract({
  text: 'اسمي أحمد وعمري 30 وأسكن في القاهرة',
  schema: { name: 'string', age: 'number', city: 'string' },
});

// Classification
const result = await aiCore.classify({ text: content, labels: ['urgent', 'normal', 'low'] });
```

## Degradation Modes (per module)

| Mode | Behaviour |
|------|-----------|
| `graceful` | Falls back to manual input |
| `queue` | Queues request for later processing |
| `circuit-breaker` | Disables AI 10 min after 5 failures + alerts SUPER_ADMIN |

## ADRs

- ADR-016 — Vercel AI SDK for provider abstraction
- ADR-017 — Drizzle ORM for pgvector

## Status

⏳ **Not yet implemented** — Phase 4
