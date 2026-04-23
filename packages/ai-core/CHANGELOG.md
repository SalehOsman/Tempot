# @tempot/ai-core

## 0.2.0

### Minor Changes

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

- 4f1b943: feat(ai-core): add Phase 2 LLM-friendly patterns

  New utilities for LLM tool integration:
  - Pagination: generic `paginate<T>()` with `PaginatedResult` and `PaginationOptions` types
  - Extension groups: `getByGroup()`, `getByGroups()`, `getGroups()` on ToolRegistry with pagination overloads
  - Output size limiting: `truncateToolOutput()` with configurable maxOutputChars and IntentRouter integration
  - Input normalization: 6 Zod preprocessors (`coerceNumber`, `coerceInteger`, `coerceBoolean`, `normalizeString`, `flexibleDate`, `normalizeArray`) for handling LLM-sent values
  - Batch tool executor: `executeBatch()` with sequential execution, partial failure support, and `BatchResult` summary

- ed16acc: feat(021): documentation system with Starlight, RAG ingestion, and AI generation pipeline

  New documentation platform at apps/docs/:
  - Starlight (Astro) site with Arabic primary + English secondary (RTL/LTR)
  - starlight-typedoc generating API reference for 15 packages
  - AI documentation generation pipeline from SpecKit artifacts
  - RAG ingestion script using ContentIngestionService from @tempot/ai-core
  - Frontmatter validation with Zod + neverthrow Result pattern
  - Freshness detection via git timestamps
  - Vale prose linting with custom Tempot style rules
  - RTL/LTR rendering verification (13 E2E tests)
  - Bilingual content seeding (8 pages × 2 locales)
  - 119 tests (unit + integration + E2E)

  Cross-package changes:
  - ai-core: Added Markdown-aware chunking strategy (chunkMarkdown) for heading-based RAG splitting

### Patch Changes

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

- Updated dependencies [7e49350]
- Updated dependencies [e8414a1]
- Updated dependencies [9c9b244]
- Updated dependencies [6d42561]
- Updated dependencies [4d1dac3]
  - @tempot/database@0.1.2
  - @tempot/event-bus@0.2.1
  - @tempot/logger@0.1.2
