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

## Local Ollama Embeddings

When Ollama runs directly on the Windows host and the bot runs inside Docker
Desktop, configure the bot runtime with:

```env
AI_EMBEDDING_PROVIDER=ollama
AI_EMBEDDING_MODEL=embeddinggemma
AI_EMBEDDING_DIMENSIONS=768
OLLAMA_BASE_URL=http://host.docker.internal:11434
TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD=
```

Verify host access before indexing:

```powershell
curl http://localhost:11434/api/tags
docker exec tempot-bot wget -qO- http://host.docker.internal:11434/api/tags
```

After switching to Ollama, rebuild the selected knowledge index from the bot
before relying on `/ask` answers. Leave
`TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD` empty unless acceptance evidence shows
that local retrieval needs a different threshold.

`Full Project` can contain thousands of documentation files. Bot-triggered write
indexing is protected by `TEMPOT_KNOWLEDGE_MAX_WRITE_CHUNKS` and fails before
embedding calls when the selected source is too large. Build `Product`,
`Operations`, `Architecture`, and `Analysis` separately first, then raise the
limit only for a planned long background run if a full-project index is still
required.

## Manual Fallback

Until the bot operations module is implemented, local ingestion can still be run
from the workspace shell after environment variables are loaded:

```powershell
pnpm --filter docs docs:ingest -- --dry-run
pnpm --filter docs docs:ingest -- --write
```

If write mode reports `DOCS.DATABASE_URL_MISSING`, the shell session did not
load the required environment variables.
