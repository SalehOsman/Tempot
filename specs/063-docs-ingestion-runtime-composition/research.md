# Research: Documentation Ingestion Runtime Composition

## Decision: Require explicit `--write` for embedding writes

**Rationale**: The current command can be run without `--dry-run`, but it does
not compose live dependencies. Switching that implicit mode to real writes would
make accidental provider/database calls more likely. Requiring `--write`
creates an intentional operator action.

**Alternatives considered**:

- Keep the existing non-dry-run default as write mode. Rejected because it
  changes a previously partial command into a destructive command without an
  explicit new operator signal.
- Make dry-run the only supported mode for this slice. Rejected because AI/RAG
  staging readiness requires real documentation embeddings.

## Decision: Persist hashes only for successful file ingestions

**Rationale**: Hashes represent indexed content. Updating a hash before all file
chunks are accepted hides failures and prevents retries during incremental
runs.

**Alternatives considered**:

- Persist discovered file hashes regardless of ingestion result. Rejected
  because it creates false indexing evidence.
- Persist per-chunk hashes. Deferred because existing cache granularity is
  file-level and sufficient for the current operator workflow.

## Decision: Keep dry-run free of runtime dependency composition

**Rationale**: Dry-run should be usable locally without `DATABASE_URL`, provider
keys, or pgvector. It previews discovery, chunking, and metadata only.

**Alternatives considered**:

- Validate database/provider configuration during dry-run. Rejected because it
  turns a preview command into an environment readiness command.

## Decision: Use the existing AI-core ingestion services for write mode

**Rationale**: `ContentIngestionService` and `EmbeddingService` already own
sanitization, chunking, embedding, delete-before-reindex, and vector storage
behavior. The docs CLI should compose these services rather than duplicating
embedding or vector repository logic.

**Alternatives considered**:

- Insert directly into the embeddings table from the docs script. Rejected
  because it bypasses AI-core service behavior and error semantics.
