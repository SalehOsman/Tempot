# Research: AI Core (Integrated Bot Assistant)

## Decisions

### 1. Vercel AI SDK v6 as Thin Orchestration Layer (ADR-031)

- **Decision:** Use Vercel AI SDK v6.x built-in features instead of hand-rolled abstractions. `createProviderRegistry()` for provider management, `LanguageModelMiddleware` for caching and resilience, `Output.choice()` / `Output.object()` for structured extraction, built-in `usage` for token tracking, and built-in OpenTelemetry for observability.
- **Rationale:** ADR-031 explicitly recommends SDK built-ins over custom code. The old plan (296 lines) designed a simple `AIProviderFactory` wrapper and manual `generateText()` + parsing — both are inferior to SDK built-ins. Upgrading from v4.x to v6.x is required (ADR to be created during implementation).
- **Alternatives rejected:** Hand-rolled `AIProviderFactory` (duplicates `createProviderRegistry()`). Per-service caching/circuit-breaker (duplicates `LanguageModelMiddleware`). Manual `generateText()` + parsing for classification (ignores type-safe `Output.choice()`).

### 2. cockatiel for Resilience (not hand-rolled)

- **Decision:** Use `cockatiel` library for circuit breaker, retry, timeout, bulkhead, and fallback. Compose policies per operation type. Integrate with `LanguageModelMiddleware` for transparent resilience.
- **Rationale:** The old plan implemented a manual `CircuitBreaker` class (30 lines, no retry/timeout/bulkhead). `cockatiel` provides production-grade resilience primitives with composable policies. This matches the PM's explicit technology choice.
- **Alternatives rejected:** Hand-rolled circuit breaker (old plan — lacks retry, timeout, bulkhead, and has no half-open state). `opossum` (less composable, heavier). AI SDK `maxRetries` (insufficient — no circuit breaker or bulkhead).

### 3. rate-limiter-flexible with Redis Backend

- **Decision:** Use `rate-limiter-flexible` with Redis adapter for per-user daily AI message limits. Configurable per role (User: 20/day, Admin: 50/day, Super Admin: unlimited). Super Admin can adjust limits via admin tools.
- **Rationale:** Battle-tested library with Redis backend for distributed state. Supports multiple rate limiting strategies (fixed window, sliding window). Redis backend shares existing Redis infrastructure from `@tempot/session-manager`.
- **Alternatives rejected:** Custom Redis counter (fragile, no sliding window). `bottleneck` (designed for job scheduling, not per-user rate limiting). In-memory rate limiting (lost on restart, no distributed support).

### 4. Langfuse for AI Observability

- **Decision:** Use `langfuse` + `@langfuse/otel` for AI-specific observability. Clear separation from Sentry: Langfuse handles AI traces, token usage, cost tracking, prompt management, and conversation analytics. Sentry handles general application errors and performance monitoring.
- **Rationale:** Langfuse provides AI-native observability that Sentry cannot: per-conversation traces, cost attribution per user, prompt version management, and A/B testing support. Integration via OpenTelemetry bridges with Vercel AI SDK's built-in telemetry.
- **Alternatives rejected:** LangSmith (LangChain ecosystem, we don't use LangChain). Sentry alone (lacks AI-specific features — no token tracking, no cost attribution, no prompt management). Custom logging (enormous effort to build conversation tracing).

### 5. Multimodal Embeddings via gemini-embedding-2-preview

- **Decision:** Use `gemini-embedding-2-preview` as the default embedding model. 3072 dimensions (PM decision, overriding architecture spec's 1536). Supports text, images, video (up to 128s), audio, and PDF in a single unified vector space. Task prefix formatting for queries vs. documents.
- **Rationale:** Multimodal embedding enables cross-modal search (e.g., find images by text query). 3072 dimensions provide highest precision for the model. Task prefixes (`task: search result | query:` for queries, `title: | text:` for documents) are recommended by Google for optimal retrieval.
- **Alternatives rejected:** `text-embedding-3-large` from OpenAI (text-only, no multimodal). `gemini-embedding-001` (lower capacity, 2048 token limit vs 8192). 1536 dimensions (architecture spec value — PM explicitly chose 3072 for maximum precision).

### 6. Dimension Migration Strategy (768 → 3072)

- **Decision:** Database migration changes the vector column dimension from 768 to 3072. Existing vectors (if any) are incompatible and require re-embedding. Migration via Drizzle schema change + background BullMQ batch re-embedding job.
- **Rationale:** Vector dimensions are fundamental to the embedding model — 768-dim vectors cannot be compared with 3072-dim vectors. Since the `packages/database` currently defaults to 768 and the new spec requires 3072, this is a breaking change requiring full re-indexing.
- **Alternatives rejected:** Dual-dimension support (complex, no real benefit — 768-dim vectors from old models are useless with new models). Gradual migration (impossible — dimensions must match for similarity search).

### 7. Six Content Types in Single Embeddings Table

- **Decision:** All RAG content stored in the existing `embeddings` table with `contentType` discriminator: `ui-guide`, `bot-functions`, `db-schema`, `developer-docs`, `custom-knowledge`, `user-memory`. Access control enforced per `contentType` before vector search.
- **Rationale:** Single table with HNSW index is simpler and more performant than multiple tables. The `contentType` filter happens at query time — the index still covers all content types. Access control is enforced in the `RAGPipeline` by filtering allowed content types based on the user's CASL role before issuing the vector similarity query.
- **Alternatives rejected:** Separate tables per content type (HNSW index per table, complex joins, no cross-type search). Separate vector databases (overkill, infrastructure complexity). Row-level security in PostgreSQL (doesn't integrate with CASL, requires Prisma bypass).

### 8. Tool Registration via Event Bus

- **Decision:** Modules register AI tools by publishing `module.tools.registered` events. The `ToolRegistry` subscribes to these events and builds its tool inventory at runtime. No compile-time coupling between modules and ai-core.
- **Rationale:** Event-driven tool registration follows Rule XIV (Event Bus for inter-module communication). Modules opt-in to AI by setting `hasAI: true` in `module.config.ts` and publishing their tool definitions. This is consistent with the module system's discovery pattern (§15.7).
- **Alternatives rejected:** Direct registration API (creates compile-time dependency on ai-core). Configuration file listing tools (static, requires restart for changes). Decorator-based registration (not compatible with event-driven architecture).

### 9. CASL Tool Filtering at Model Input Level

- **Decision:** Before each AI model call, filter the tool list based on the current user's CASL abilities. Only permitted tools are passed to `generateText()` / tool loop. The model never receives information about tools the user cannot access.
- **Rationale:** Input-level filtering is more secure than post-hoc filtering. If the model never sees unauthorized tools, it cannot hallucinate about them. This is a fundamental security decision that prevents information leakage through the AI assistant.
- **Alternatives rejected:** Post-hoc tool call validation (model may reference tools it cannot call, confusing for users). Separate model instances per role (expensive, impractical). Tool description masking (complex, error-prone — better to simply not include).

### 10. Conversation Memory via Summarization + Embedding

- **Decision:** When an AI session ends, the conversation is summarized by the AI model. The summary is embedded and stored with `contentType: 'user-memory'` and the user's ID in metadata. New sessions retrieve 3-5 relevant past summaries via semantic search.
- **Rationale:** Storing raw conversation history is expensive (token-wise) and unnecessary. Summaries capture the essential context in a compact form. Embedding summaries enables semantic retrieval — the system finds relevant past context even when the exact words differ.
- **Alternatives rejected:** Full conversation history in context window (token limit, expensive). Redis-based conversation cache (lost on restart, not semantically searchable). No conversation memory (poor UX, users repeat themselves).

### 11. Three-Level Write Action Confirmation

- **Decision:** Each AI tool declares a `confirmationLevel`: `none` (read-only), `simple` (summary + confirm/cancel), `detailed` (full details + confirm/cancel), `escalated` (extra 6-digit code). Confirmations expire after 5 minutes (Rule LXVII).
- **Rationale:** Different write actions have different risk levels. A simple status change needs minimal confirmation, while deleting a user's data needs extra verification. The tool author knows the risk level best and declares it at registration time.
- **Alternatives rejected:** Uniform confirmation for all writes (annoying for low-risk actions). No confirmation (dangerous for high-risk actions). Separate confirmation service per module (duplicates logic, inconsistent UX).

### 12. Structural Interfaces for Dependency Injection

- **Decision:** Define minimal structural interfaces for external dependencies (`AILogger`, `AIEventBus`, `AICache`) in `ai-core.contracts.ts` instead of importing `@tempot/logger`, `@tempot/event-bus`, `@tempot/shared` types directly.
- **Rationale:** Same pattern proven in storage-engine (Research Decision 6). Prevents circular dependencies in the monorepo graph. Makes unit testing trivial — mock implementations match the minimal interface. At runtime, the real implementations are injected.
- **Alternatives rejected:** Direct imports (circular dependency risk). Abstract base classes (TypeScript structural typing makes interfaces sufficient).

### 13. Content Chunking Strategy

- **Decision:** Documents are chunked before embedding. Default chunk size ~500 tokens with 50-token overlap. Maximum document size 10MB (validated before processing). Chunks preserve metadata linkage via `chunkIndex` / `totalChunks` in the metadata JSONB field.
- **Rationale:** Embedding models have token limits (8192 for gemini-embedding-2-preview). Chunking with overlap ensures context continuity across boundaries. 500-token chunks balance precision (smaller = more precise matching) with context (larger = more context per result).
- **Alternatives rejected:** No chunking (exceeds model token limits for large documents). Sentence-level splitting (too granular, loses paragraph context). Page-level splitting (too coarse for precise retrieval).

### 14. Developer RAG and CLI Tools

- **Decision:** Two CLI commands: `pnpm ai:dev "question"` for codebase Q&A (RAG from `developer-docs` content type) and `pnpm ai:review --module {name}` for module review. Both use the same `AIProviderFactory` and `EmbeddingService` as the bot, but run in a CLI context without Telegram dependencies.
- **Rationale:** Developers benefit from AI-assisted codebase navigation and module quality checks. CLI tools reuse the same AI infrastructure, avoiding duplication. The `developer-docs` content type is indexed from markdown files and code comments.
- **Alternatives rejected:** Separate developer AI package (duplicates infrastructure). Web-based developer portal (overkill for current needs). IDE extensions (platform-specific, maintenance burden).

### 15. PII Sanitization Before Embedding

- **Decision:** Content is sanitized before embedding — personal data (names, phone numbers, IDs) is replaced with reference IDs. The `user-memory` content type stores conversation summaries, not raw transcripts.
- **Rationale:** Embeddings are stored in plaintext in the database. Personal data in embeddings could be reconstructed via similarity search from other users' queries. Sanitization prevents this leakage.
- **Alternatives rejected:** Encrypted embeddings (breaks similarity search — encrypted vectors cannot be compared). No sanitization (PII leakage risk). Per-user vector isolation (complex, prevents cross-user knowledge sharing for non-PII content).

## Deferred Features

| Feature                     | Status         | Notes                                                           |
| --------------------------- | -------------- | --------------------------------------------------------------- |
| Auto-fill suggestions       | Not in Phase 1 | Requires module-specific training data, deferred to Phase 2     |
| Streaming AI responses      | Not in Phase 1 | Telegram messages don't support streaming, deferred             |
| Multi-agent orchestration   | Not in Phase 1 | Single assistant model sufficient for current use cases         |
| AI-powered input validation | Not in Phase 1 | `input-engine` package not yet implemented                      |
| Dynamic translation via AI  | Not in Phase 1 | i18n-core handles static translations, AI translation deferred  |
| A/B testing of prompts      | Not in Phase 1 | Langfuse supports this, but deferred until baseline established |
