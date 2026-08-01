# Knowledge Management RAG Operations Design

## Goal

Build a professional Telegram operations console that lets super admins manage
AI/RAG documentation indexing from inside the bot without making Docker builds
stateful or unsafe.

## Recommended Architecture

Create a dedicated `knowledge-management` module. The module owns operator UX:
status, source selection, dry-run, write confirmation, full reindex
confirmation, job history, and test queries. It receives a
`KnowledgeOperationsProvider` from `bot-server`.

`bot-server` owns runtime infrastructure composition. It adapts existing
`@tempot/ai-core` ingestion and retrieval services, validates source profiles,
checks pgvector/embeddings readiness, and executes indexing jobs against
approved runtime source mounts.

## Source Safety

The bot must never accept arbitrary filesystem paths from Telegram. Operators
choose approved source profiles only:

- `product-help`: `docs/product` as `ui-guide`.
- `admin-ops`: `docs/operations` and `docs/architecture` as `developer-docs`.
- `developer-docs`: `specs`, `packages`, and `modules` as `developer-docs`.
- `full-project`: approved profiles combined.

This prevents accidental indexing of `.env`, local backups, or other sensitive
workspace files.

## Runtime Model

Docker image build stays deterministic and does not run ingestion. Write
ingestion is an operator action because it mutates the database, calls an
external AI provider, consumes credentials, and depends on environment-specific
source availability.

Local Docker should mount approved source folders read-only into
`/app/knowledge-sources/...`. Staging can later use a read-only artifact, mounted
volume, or a separate ingestion worker.

## UX Flow

The main menu entry is visible to `SUPER_ADMIN` only:

```text
Knowledge Management

Status
Sources
Dry Run
Write Index
Full Reindex
History
Test Query
Back
```

Write ingestion requires a recent successful dry-run for the same profile.
Full reindex requires two confirmations. Expired or stale confirmations do not
execute anything.

## Error Handling

Zero embeddings is not a system failure; it is a `needs-index` state with a clear
next action. Provider failures, missing source mounts, missing database
configuration, and pgvector problems are displayed as safe remediation messages
without secrets or stack traces.

## Test Strategy

Use TDD:

- Provider contract tests for status, profiles, dry-run, write gating, and test
  query.
- Module runtime tests for callbacks, permissions, confirmation expiry, and
  rendering.
- Locale parity and Telegram keyboard UX checks.
- Bot runtime build validation.
- Docker evidence only after approved source mounts are configured.

## Decision

Proceed with Spec #066 as a separate module, not as an extension of
`help-center`. `help-center` consumes RAG answers. `knowledge-management`
operates the knowledge base that makes those answers useful.
