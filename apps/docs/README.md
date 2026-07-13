# @tempot/docs

> Engineering documentation site powered by Astro + Starlight

## Purpose

Developer documentation for all Tempot packages:

- API reference via TypeDoc
- Architecture Decision Records (ADRs)
- Developer guides and workflows
- Package documentation and usage examples

## Phase

Phase 2 — Documentation System (spec #021)

## Dependencies

Requires Node.js 22.12+ because Astro 6 is the documentation runtime.

| Package                | Purpose                           |
| ---------------------- | --------------------------------- |
| Astro 6                | Static site generator             |
| Starlight 0.38         | Documentation theme              |
| starlight-typedoc      | TypeDoc integration               |
| @tempot/shared         | Result pattern, AppError          |

## Scripts

```bash
pnpm --filter docs dev        # Start dev server
pnpm --filter docs build      # Build for production
pnpm --filter docs preview    # Preview production build
```

`build` removes the generated API reference directory before running Astro so
TypeDoc pages are recreated without duplicate Starlight IDs. Set `DOCS_SITE` to
the deployed documentation URL when building outside the default GitHub Pages
target.

## RAG Ingestion

Preview documentation indexing without writes:

```bash
pnpm --filter docs docs:ingest -- --dry-run
```

Write embeddings to the configured PostgreSQL + pgvector store:

```bash
pnpm --filter docs docs:ingest -- --write
```

Force a complete re-index:

```bash
pnpm --filter docs docs:ingest -- --write --full
```

Write mode requires `DATABASE_URL`, `TEMPOT_AI`, `TEMPOT_AI_PROVIDER`,
`AI_EMBEDDING_MODEL`, and the provider credentials required by the selected
Vercel AI SDK provider. Hashes are saved only for successfully ingested files.

## Status

✅ **Implemented** — Phase 2
