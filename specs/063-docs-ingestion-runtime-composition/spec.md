# Feature Specification: Documentation Ingestion Runtime Composition

**Feature Branch**: `codex/ai-rag-runtime-composition`
**Created**: 2026-07-13
**Status**: Implemented
**Input**: User description: "Continue AI/RAG module work now and update the plan and documentation completely."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preview Documentation Ingestion Safely (Priority: P1)

An operator can run the documentation ingestion command in dry-run mode to see
which documentation files would be indexed, including chunk counts and content
hashes, without opening a database connection, calling an AI provider, or
changing the hash cache.

**Why this priority**: Dry-run is the safety gate for staging and production
operations. It lets operators verify scope before writing embeddings.

**Independent Test**: Run the ingestion command with `--dry-run` against a test
documentation tree and assert that no hash file is written and no ingestion
service is called.

**Acceptance Scenarios**:

1. **Given** changed documentation files, **When** an operator runs
   `docs:ingest -- --dry-run`, **Then** the command reports file-level preview
   records and leaves the existing hash cache unchanged.
2. **Given** unchanged documentation files and an existing hash cache, **When**
   the operator runs dry-run without `--full`, **Then** unchanged files are
   reported as skipped without writes.

---

### User Story 2 - Write Embeddings With Explicit Operator Intent (Priority: P1)

An operator can run the documentation ingestion command in write mode to compose
the AI provider registry, database connection, embedding service, and content
ingestion service, then store documentation embeddings in the vector store.

**Why this priority**: AI/RAG cannot move from foundation package to staging
capability until there is a documented and repeatable command that writes real
documentation embeddings.

**Independent Test**: Run the orchestration path with mocked runtime
dependencies and assert that changed files are ingested and hashes are updated
only after successful file ingestion.

**Acceptance Scenarios**:

1. **Given** a configured database and AI provider environment, **When** an
   operator runs `docs:ingest -- --write`, **Then** changed files are ingested
   through `ContentIngestionService` and successful file hashes are persisted.
2. **Given** one file fails during ingestion, **When** write mode completes,
   **Then** the failed file is reported with a structured error and its hash is
   not marked as successfully indexed.

---

### User Story 3 - Re-index Documentation Intentionally (Priority: P2)

An operator can force a complete documentation re-index without relying on stale
hashes.

**Why this priority**: Re-indexing is required after embedding model changes,
schema resets, or rollback recovery.

**Independent Test**: Run write mode with `--full` and assert that unchanged
files are processed instead of skipped.

**Acceptance Scenarios**:

1. **Given** unchanged hashes, **When** the operator runs
   `docs:ingest -- --write --full`, **Then** all discovered files are processed.
2. **Given** write mode succeeds for all files, **When** the command completes,
   **Then** the persisted hash cache matches the successfully indexed content.

### Edge Cases

- Documentation directory is missing.
- The hash cache file is missing or invalid.
- AI is explicitly disabled with `TEMPOT_AI=false`.
- `DATABASE_URL` is missing in write mode.
- The provider registry cannot be created because provider configuration is
  invalid.
- A file cannot be read.
- Markdown chunking fails for a file.
- One or more chunks fail to embed.
- Dry-run is requested together with write mode.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The ingestion CLI MUST support `--dry-run` as a no-write preview
  mode.
- **FR-002**: The ingestion CLI MUST support an explicit `--write` mode for
  database and AI provider writes.
- **FR-003**: The default mode MUST remain safe and MUST NOT write embeddings or
  update the hash cache unless `--write` is provided.
- **FR-004**: Write mode MUST compose `ContentIngestionService` and
  `EmbeddingService` from runtime configuration instead of using test doubles.
- **FR-005**: Write mode MUST connect to the configured PostgreSQL vector store
  through the existing database and AI-core abstractions.
- **FR-006**: Hashes MUST be persisted only for files whose ingestion completed
  successfully.
- **FR-007**: Failed files MUST be reported as structured JSON log records and
  MUST NOT be silently marked as indexed.
- **FR-008**: The CLI MUST preserve incremental skip behavior unless `--full`
  is provided.
- **FR-009**: Dry-run MUST report enough metadata for operators to understand
  scope, including file path, language, content type, hash, and chunk count.
- **FR-010**: Documentation MUST describe environment variables, dry-run/write
  commands, failure behavior, rollback, and re-index procedures.

### Key Entities

- **Ingestion Run**: One CLI execution, including mode, processed count,
  skipped count, failed count, and hash persistence behavior.
- **Documentation File**: A discovered Markdown file under `docs/product`,
  including relative path, content hash, language, frontmatter, and chunk
  preview.
- **Ingestion Failure**: A structured file-level error with file path, error
  code, and details.
- **Hash Cache**: The local `.docs-hashes.json` state that records only
  successfully indexed file hashes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Dry-run completes without creating or modifying the hash cache.
- **SC-002**: Write mode updates the hash cache only for successfully ingested
  files.
- **SC-003**: A single failed file produces a structured error and does not hide
  the failure behind a successful run summary.
- **SC-004**: The documentation includes one copy-pastable dry-run command and
  one copy-pastable write-mode command for operators.
- **SC-005**: Focused unit tests cover dry-run, write mode, partial failure, and
  forced re-index behavior.

## Assumptions

- The existing `@tempot/ai-core` services remain the source of truth for
  chunking, embedding, and ingestion behavior.
- `docs/product` remains the documentation ingestion root for this slice.
- The vector schema from Spec #062 has already been migrated before write mode
  is used against staging or production.
- The first runtime bot flow activation remains out of scope for this feature.
