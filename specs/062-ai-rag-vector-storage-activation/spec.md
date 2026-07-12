# Feature Specification: AI/RAG Vector Storage Activation

**Feature Branch**: `codex/ai-rag-module-docs`
**Created**: 2026-07-12
**Status**: Approved for first execution slice by Project Manager request on 2026-07-12.
**Input**: Start implementing the AI/RAG runtime activation plan. The first executable slice must make pgvector embeddings storage reproducible in staging and production before any Telegram bot AI flow is activated.

## User Scenarios & Testing

### User Story 1 - Operator can migrate a clean database for AI/RAG storage (Priority: P1)

As a deployment operator, I want the database migrations to create the pgvector extension,
the `embeddings` table, and the halfvec HNSW index so AI/RAG can store and retrieve vectors
without relying on test helpers or manual SQL.

**Why this priority**: RAG cannot be activated safely until vector storage is reproducible in
staging and production.

**Independent Test**: A unit test inspects the committed migration SQL and proves it creates
the vector extension, the `embeddings` table, the 3072-dimension vector column, and the halfvec
HNSW index.

**Acceptance Scenarios**:

1. **Given** a clean PostgreSQL database, **When** committed migrations are applied, **Then**
   the `vector` extension exists.
2. **Given** committed migrations are applied, **When** AI/RAG writes embeddings, **Then**
   the `embeddings` table has `content_id`, `content_type`, `vector`, and `metadata` columns.
3. **Given** the embeddings schema exists, **When** similarity search runs, **Then** the
   `embeddings_vector_hnsw_idx` index can support halfvec cosine search for 3072 dimensions.

## Edge Cases

- The migration must be idempotent for extension creation.
- The migration must not add a Prisma model for embeddings; Drizzle remains the pgvector schema owner.
- The migration must not change existing protected-data, user, or interaction-event schemas.
- The migration must keep the vector dimension aligned with `DB_CONFIG.VECTOR_DIMENSIONS`.

## Requirements

### Functional Requirements

- **FR-001**: A committed production migration MUST create the PostgreSQL `vector` extension.
- **FR-002**: The migration MUST create the `embeddings` table when it does not exist.
- **FR-003**: The table MUST include `id`, `content_id`, `content_type`, `vector`, and `metadata` columns.
- **FR-004**: The `vector` column MUST use 3072 dimensions to match the current Gemini embedding model default.
- **FR-005**: The migration MUST create `embeddings_vector_hnsw_idx` using HNSW over a `halfvec(3072)` expression with cosine operators.
- **FR-006**: The implementation MUST add a regression test that fails when the committed migration evidence is absent or mismatched.
- **FR-007**: The implementation MUST NOT add a Prisma model for embeddings.
- **FR-008**: Documentation MUST identify this as the first AI/RAG runtime activation workstream and keep bot-flow activation pending.

## Key Entities

- **Embeddings Migration**: A committed SQL migration that prepares pgvector storage for AI/RAG.
- **Embeddings Table**: The physical storage table used by `DrizzleVectorRepository` and `EmbeddingService`.
- **Migration Evidence Test**: A deterministic unit test that verifies committed migration contents.

## Success Criteria

- **SC-001**: The new migration evidence test fails before the migration exists and passes after implementation.
- **SC-002**: `pnpm --filter @tempot/database test -- tests/unit/vector-migration.test.ts` passes.
- **SC-003**: `pnpm --filter @tempot/database build` passes.
- **SC-004**: `tsx scripts/spec-validate/index.ts --all` reports zero critical issues.
- **SC-005**: `git diff --check` reports no whitespace errors.

