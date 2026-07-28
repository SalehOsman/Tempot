# Quickstart: Knowledge Management RAG Operations

## Local Docker Source Mounts

The production bot image does not include the full project documentation source.
For local ingestion from the bot, mount approved source folders as read-only
runtime paths before enabling write ingestion.

Example conceptual mapping:

```text
F:\Tempot\docs      -> /app/knowledge-sources/docs:ro
F:\Tempot\specs     -> /app/knowledge-sources/specs:ro
F:\Tempot\modules   -> /app/knowledge-sources/modules:ro
F:\Tempot\packages  -> /app/knowledge-sources/packages:ro
```

The implementation must document the exact Compose service changes before
operators rely on bot-triggered ingestion.

## Operator Flow

1. Open `Knowledge Management`.
2. Open `Status`.
3. Open `Sources` and select a profile.
4. Run `Dry Run`.
5. Review file and chunk counts.
6. Confirm `Write`.
7. Open `Status` and verify embeddings count increased.
8. Run a test question.
9. Try `/ask <question>` in Help Center.

## Current Manual Fallback

Until the bot operations module is implemented, local ingestion can still be run
from the workspace shell after environment variables are loaded:

```powershell
pnpm --filter docs docs:ingest -- --dry-run
pnpm --filter docs docs:ingest -- --write
```

If write mode reports `DOCS.DATABASE_URL_MISSING`, the shell session did not
load the required environment variables.
