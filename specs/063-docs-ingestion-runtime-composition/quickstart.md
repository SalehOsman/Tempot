# Quickstart: Documentation Ingestion Runtime Composition

## Preview indexing scope

```powershell
pnpm --filter docs docs:ingest -- --dry-run
```

Use this before every write-mode run. Dry-run reports discovered files and chunk
counts without requiring `DATABASE_URL` or provider credentials.

## Write documentation embeddings

```powershell
pnpm --filter docs docs:ingest -- --write
```

Write mode requires the vector migration from Spec #062 to be applied first.

## Force a complete re-index

```powershell
pnpm --filter docs docs:ingest -- --write --full
```

Use this after changing the embedding model, resetting the vector store, or
recovering from a failed deployment.

## Required environment variables for write mode

- `DATABASE_URL`
- `TEMPOT_AI`
- `TEMPOT_AI_PROVIDER`
- `AI_EMBEDDING_MODEL`
- Provider credentials required by the selected Vercel AI SDK provider.

## Failure behavior

- Dry-run does not write embeddings or update `.docs-hashes.json`.
- Write mode updates `.docs-hashes.json` only for files ingested successfully.
- File-level failures are logged as structured JSON records.
- Failed files are retried by the next incremental write run.
