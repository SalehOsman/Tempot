---
'@tempot/ai-core': minor
'@tempot/database': patch
'@tempot/event-bus': patch
---

feat(ai-core): implement ai-core package with full TDD

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
