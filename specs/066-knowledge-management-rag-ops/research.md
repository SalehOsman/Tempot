# Research: Knowledge Management RAG Operations

## Decision: create `knowledge-management` module

The feature should be a dedicated operational module rather than extending
`help-center`. `help-center` is the user-facing consumer of RAG answers, while
knowledge indexing is a super-admin operational workflow that changes database
state and consumes provider credentials.

## Decision: inject provider from bot-server

The module should receive a `KnowledgeOperationsProvider` from `bot-server`.
This follows the pattern used for backup operations and the help assistant:
business modules own UX and domain intent, while `bot-server` composes runtime
infrastructure.

## Decision: no arbitrary path input

Telegram must not accept free-form filesystem paths for ingestion. Allowlisted
profiles are safer, easier to test, and prevent accidental indexing of secrets
or local-only files.

## Decision: dry-run before write

Dry-run must be required before write ingestion. It gives operators file counts,
chunk counts, failures, and cost/risk visibility without modifying embeddings or
hashes.

## Decision: source files as runtime mounts

The Docker production image intentionally copies only runtime artifacts. It
should not include the entire repository source tree. Local and staging
ingestion should use explicit read-only mounts or a future ingestion worker.

## Decision: local Ollama embeddings

Knowledge indexing should support `ollama` as an embedding provider for local
Docker Desktop operation. This lets operators build large documentation indexes
without consuming Gemini or OpenAI embedding quota. Ollama is limited to
embedding generation in this feature; chat generation remains controlled by the
separate chat provider setting.

The current database migration stores `vector(3072)`. Shorter local embedding
vectors are zero-padded at the `ai-core` boundary before storage and retrieval,
which preserves cosine similarity when both document and query vectors use the
same provider and normalization path. Operators must rebuild the index after
switching embedding provider or model.

## Alternatives Rejected

| Alternative | Reason Rejected |
| --- | --- |
| Run `pnpm docs:ingest --write` during Docker build | Build would need secrets, database access, network provider calls, and would mutate external state. |
| Put indexing inside `help-center` | Blurs user help with super-admin operations and makes permissions harder to reason about. |
| Accept arbitrary path text from Telegram | High risk of reading `.env`, secrets, or unintended local files. |
| Copy all docs/specs/modules/packages into the bot image | Increases runtime image size and source exposure, and conflicts with minimal runtime image policy. |
| Replace chat providers with Ollama | The approved local requirement is quota-free indexing; chat quality and cost policy remain separate. |
