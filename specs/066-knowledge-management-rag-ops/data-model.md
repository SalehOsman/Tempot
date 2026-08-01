# Data Model: Knowledge Management RAG Operations

The first release may keep job state in provider-managed runtime storage or
repository-backed metadata, depending on the implementation phase. Public
contracts must remain stable either way.

## KnowledgeSourceProfile

- `id`: stable profile id used in callback data.
- `labelKey`: i18n key for display.
- `descriptionKey`: i18n key for safe explanation.
- `roots`: approved mounted source roots.
- `contentType`: RAG content type written to embeddings.
- `languagePolicy`: `all`, `arabic`, or `english`.
- `sourcePriority`: numeric ranking for ingestion metadata.
- `sourceOfTruth`: whether the profile is authoritative.
- `enabled`: whether operators can select the profile.

## IngestionJob

- `id`: stable job identifier.
- `actorId`: requesting super-admin user id.
- `profileId`: selected profile.
- `mode`: `dry-run`, `write`, or `full-reindex`.
- `status`: `queued`, `running`, `completed`, `failed`, or `cancelled`.
- `startedAt`: timestamp.
- `completedAt`: optional timestamp.
- `summary`: optional `IngestionSummary`.
- `failureCode`: optional safe error code.

## IngestionSummary

- `processedFiles`: number of discovered files processed.
- `skippedFiles`: number of skipped files.
- `failedFiles`: number of failed files.
- `chunkCount`: number of chunks produced or written.
- `hashesWritten`: whether hash state was updated.
- `durationMs`: operation duration.
- `profileId`: selected profile.
- `mode`: operation mode.

## IngestionConfirmation

- `token`: opaque confirmation identifier.
- `profileId`: selected profile.
- `mode`: write or full-reindex.
- `dryRunJobId`: required for write.
- `expiresAt`: confirmation expiry timestamp.
- `actorId`: confirming operator.

## RAGReadinessSnapshot

- `aiEnabled`: whether AI is enabled.
- `providerReady`: whether provider registry can be created.
- `databaseReady`: whether database is reachable.
- `vectorReady`: whether pgvector and embeddings table are available.
- `embeddingsCount`: current embeddings count.
- `lastJob`: optional safe summary of the most recent ingestion job.
- `status`: `ready`, `needs-index`, `degraded`, or `unconfigured`.

## RAGTestQueryResult

- `state`: `answered`, `no-context`, or `degraded`.
- `answerPreview`: safe answer or snippet.
- `citationCount`: number of citations.
- `confidence`: retrieval confidence.
- `reasonCode`: optional safe reason for degraded/no-context states.
