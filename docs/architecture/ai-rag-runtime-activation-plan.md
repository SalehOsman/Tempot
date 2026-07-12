# AI/RAG Runtime Activation Plan

> Status: execution plan for activating the existing `@tempot/ai-core`
> foundation as a real bot capability.
>
> Date: 2026-07-12
>
> Related artifacts:
>
> - `specs/015-ai-core-package/`
> - `specs/027-tempot-multimodal-rag-methodology/`
> - `specs/029-ai-core-content-block-contracts/`
> - `specs/030-ai-core-retrieval-planning-and-grounding/`
> - `specs/031-ai-core-rag-runtime-wiring/`
> - `specs/032-ai-core-rag-evaluation-fixtures/`

## Current State

`@tempot/ai-core` is an implemented foundation package. It provides provider
configuration, resilience, rate limiting, embeddings, content ingestion,
retrieval planning, RAG runtime selection, answer-state contracts, deterministic
evaluation fixtures, tool routing primitives, and Telegram assistant UI classes.

The package is not yet activated as a user-facing Telegram bot capability. The
current bot runtime and active business modules do not instantiate the AI/RAG
runtime path, and active modules remain configured with `hasAI: false`.

## Activation Definition

AI/RAG is considered activated only when all of these are true:

1. A runtime composition point creates the AI provider registry, embedding
   service, content ingestion service, RAG pipeline, audit service, and logger.
2. The target PostgreSQL environment has the `pgvector` extension, the
   `embeddings` table, and the halfvec HNSW index installed through a committed
   production migration or an explicitly documented operational migration.
3. A documented ingestion command stores real `developer-docs`, `ui-guide`, or
   module knowledge embeddings in the vector store.
4. At least one Telegram bot flow calls `RAGPipeline.retrieveWithPlan()`,
   builds a `RAGAnswerState`, and renders localized responses.
5. The owning module declares `hasAI: true` and defines `aiDegradationMode` as
   required by the constitution.
6. Evaluation fixtures and runtime tests prove retrieval hit, citation coverage,
   unauthorized leakage prevention, and no-context correctness for the activated
   flow.

Until these conditions are met, AI/RAG remains a foundation package rather than
a production bot feature.

## Workstream 1: Documentation And Spec Reconciliation

Goal: make the source of truth match the implemented and non-implemented
capabilities.

Tasks:

- Reconcile Spec #015 as the completed foundation package and explicitly move
  runtime bot activation into this activation plan or a future SpecKit feature.
- Mark Spec #031 and Spec #032 artifacts as completed where their tasks and
  roadmap already show completion.
- Keep Spec #027 as methodology and architecture guidance, not runtime
  activation.
- Document that `docs:ingest` currently has reusable ingestion functions, but
  the CLI entry point does not yet compose live database and AI provider
  dependencies.
- Document that root scripts `ai:dev` and `ai:review` are not currently exposed.

Exit criteria:

- `docs/ROADMAP.md`, `packages/ai-core/README.md`, and the relevant SpecKit
  artifacts describe the same operational state.
- `pnpm spec:validate` reports zero critical documentation reconciliation
  issues.

## Workstream 2: Vector Storage Migration

Goal: make the vector store reproducible in staging and production.

Current evidence:

- Spec #062 adds committed migration evidence under
  `packages/database/prisma/migrations/20260712000000_add_ai_rag_embeddings/`.
- The migration creates the `vector` extension, the `embeddings` table, and the
  `embeddings_vector_hnsw_idx` halfvec HNSW index.
- `packages/database/tests/unit/vector-migration.test.ts` guards the committed
  migration contents.

Tasks:

- Add or verify a committed migration that creates the `vector` extension, the
  `embeddings` table, and the `embeddings_vector_hnsw_idx` halfvec HNSW index.
- Keep Drizzle as the pgvector schema owner and avoid adding Prisma models for
  embeddings unless a separate architecture decision changes ownership.
- Add a focused verification path proving the migration works on PostgreSQL 16
  with pgvector.

Exit criteria:

- A clean database can be migrated without relying on test helpers.
- `EmbeddingService.embedAndStore()` and similarity search can run against the
  migrated schema in an integration test or staging smoke.

## Workstream 3: Operational Documentation Ingestion

Goal: turn documentation ingestion into an operator-safe command.

Tasks:

- Add a dependency composition layer for the docs ingestion CLI.
- Support `--dry-run` for discovery and chunk preview without writes.
- Support a write mode that instantiates `ContentIngestionService` and
  `EmbeddingService`, connects to the configured database, stores embeddings,
  and records hashes only after successful writes.
- Document required environment variables, failure behavior, and rollback or
  re-index procedure.

Exit criteria:

- Operators can run one documented command to index docs into the vector store.
- Failed files report structured errors and do not silently update hashes as if
  ingestion succeeded.

## Workstream 4: Runtime Composition

Goal: create a single governed composition point for AI/RAG runtime services.

Tasks:

- Build a factory or bootstrap module that wires:
  - `loadAIConfig()`
  - provider registry
  - Drizzle database connection
  - `EmbeddingService`
  - `ContentIngestionService`
  - `RAGPipeline`
  - audit and logger dependencies
- Enforce `TEMPOT_AI=false` through `guardEnabled` before provider calls.
- Preserve `Result<T, AppError>` for public fallible factory APIs.
- Keep business modules isolated from direct database or provider setup.

Exit criteria:

- Bot runtime code can request an AI/RAG service from one composition boundary.
- The composition boundary can degrade cleanly when AI is disabled or a provider
  is unavailable.

## Workstream 5: First Bot Flow Activation

Goal: activate one narrow AI/RAG capability inside the Telegram bot.

Recommended first flow: Help Center or documentation search, because it can be
read-only, access controlled, and easier to validate than write-action tool
execution.

Tasks:

- Select the owning module and create a SpecKit feature for the activation.
- Set `hasAI: true` only for the owning module.
- Add `aiDegradationMode` with a constitution-compliant mode.
- Route one bot command or callback into the RAG service.
- Render `answered`, `no-context`, and `degraded` states through i18n keys.
- Keep write actions and tool execution out of the first activation slice unless
  separately specified.

Exit criteria:

- A user can ask one scoped question from Telegram and receive a localized,
  citation-backed answer or a localized no-context response.
- Unauthorized content never reaches the model or response renderer.

## Workstream 6: Evaluation And Release Gate

Goal: prove the activated flow is safe enough for staging.

Tasks:

- Extend the existing deterministic fixtures only for the activated content
  type and access model.
- Add runtime tests for:
  - authorized retrieval
  - unauthorized leakage prevention
  - no-context fallback
  - degraded provider behavior
  - localized rendering
- Run the relevant gates before merge:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test:unit`
  - `pnpm test:integration`
  - `pnpm spec:validate`
  - `pnpm docs:check`
  - `pnpm boundary:audit`

Exit criteria:

- All relevant local gates pass.
- Staging smoke proves ingestion, retrieval, response rendering, and AI
  degradation behavior against the selected environment.

## Provider Policy

`TEMPOT_AI_PROVIDER` controls the chat provider. The current embedding default
is Google Gemini through `AI_EMBEDDING_MODEL=gemini-embedding-2-preview`.
Embedding provider changes are not safe as a live runtime fallback because
different providers produce incompatible vector spaces.

Any future embedding-provider switch must include:

- an explicit configuration decision,
- a re-index plan,
- compatibility documentation,
- and staging proof that existing vectors were rebuilt.

## Readiness Summary

| Area | Current status | Activation requirement |
| --- | --- | --- |
| `@tempot/ai-core` package | Implemented foundation | Keep as service package |
| Bot runtime AI/RAG flow | Not active | Add one governed module flow |
| Active module `hasAI` usage | Not active | Set only for selected module |
| Vector schema | Drizzle schema and committed migration evidence exist | Staging migration smoke |
| Docs ingestion CLI | Partial | Compose real dependencies and write embeddings |
| Evaluation fixtures | Deterministic test-only fixtures exist | Extend for activated flow |
| Staging readiness | Not ready for AI/RAG | Complete Workstreams 2-6 |
