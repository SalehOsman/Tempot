---
title: Documentation Platform
description: Professional documentation structure, Starlight usage, and validation gates
tags:
  - development
  - documentation
  - starlight
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Platform

Tempot uses Astro, Starlight, starlight-typedoc, and TypeDoc for the published
documentation site.

The accepted architecture decision is:

```text
docs/architecture/adr/ADR-038-starlight-over-docusaurus.md
```

## Structure

Use Starlight pages for human navigation and repository-native files for source
of truth. Do not manually edit generated TypeDoc reference pages.

The restructure plan is maintained at:

```text
docs/developer/documentation-restructure-plan.md
```

## Validation

Run these checks after broad documentation changes:

```bash
pnpm lint
pnpm spec:validate
pnpm --filter docs docs:validate
pnpm --filter docs build
```

Also run graph quality validation after changes to `.understand-anything/` or AI
onboarding documents.

## Active Documentation Hygiene Checks

Before merging documentation changes, verify the following for all active
published pages and entry points:

### Frontmatter Validation

Active Starlight pages must have valid frontmatter including `title`,
`description`, `tags`, `audience`, `contentType`, and `difficulty` fields.
Generated TypeDoc pages are excluded from manual frontmatter review.

### Freshness Check

Active entry points and source-of-truth documents must not reference:

- Removed package names or old tool names.
- Deprecated environment variable names.
- Incorrect phase statuses that conflict with the current Roadmap.

### Internal Link Validation

Active documentation links must point to real repository paths. Verify that
paths referenced in `docs/README.md`, `docs/development/README.md`, and
Starlight pointer pages exist in the current tree.

### Mojibake Scan

Active documentation files and Starlight configuration labels must not contain
encoding damage. Common mojibake markers include corrupted Arabic characters and
garbled UTF-8 sequences in navigation labels.

### Exclusions

Historical archive files under `docs/archive/superpowers/` are excluded from
hygiene checks unless they are listed as active source documents in the archive
inventory.

## RAG Ingestion

Documentation ingestion into `@tempot/ai-core` is governed by
`specs/063-docs-ingestion-runtime-composition/`.

Preview the indexing scope without provider or database writes:

```bash
pnpm --filter docs docs:ingest -- --dry-run
```

Write documentation embeddings to the configured vector store:

```bash
pnpm --filter docs docs:ingest -- --write
```

Force a complete re-index after changing the embedding model, resetting the
vector table, or recovering from a failed deployment:

```bash
pnpm --filter docs docs:ingest -- --write --full
```

Write mode requires the Spec #062 vector migration to be applied and these
environment variables to be configured:

- `DATABASE_URL`
- `TEMPOT_AI`
- `TEMPOT_AI_PROVIDER`
- `AI_EMBEDDING_MODEL`
- Provider credentials required by the selected Vercel AI SDK provider

The command updates `apps/docs/.docs-hashes.json` only for files ingested
successfully. Failed files emit structured JSON errors and remain retryable on
the next incremental write run.
