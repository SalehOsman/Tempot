# Knowledge Management

`knowledge-management` is the super-admin Telegram operations console for AI/RAG
knowledge indexing. It owns bot UX and delegates all ingestion, retrieval, and
runtime checks to an injected provider from `bot-server`.

The module does not accept arbitrary filesystem paths. Operators choose approved
source profiles only, then run dry-run previews before any write operation.

## Source Profiles

The bot exposes these build profiles from the Knowledge menu:

| Profile | Root |
| --- | --- |
| Product | `docs/product` |
| Operations | `docs/operations` |
| Architecture | `docs/architecture` |
| Analysis | `docs/project-analysis` |
| Full Project | `docs`, `specs`, `packages`, `modules` |

Long-running dry-run and write operations run in the background. The bot sends
an immediate waiting message, then sends a separate completion or failure message
when the operation finishes. `Write index` is a one-step operation from the bot
menu; the older confirmation contract remains available only for compatibility.
One-step writes are capped by `TEMPOT_KNOWLEDGE_MAX_WRITE_CHUNKS` so large
sources, especially Full Project, do not starve Telegram responsiveness. Build
large knowledge bases section by section, or raise the limit only for a planned
long background run.

## Custom Profiles

Super admins can add a mounted custom source from the bot:

```text
/knowledge_custom Name | relative/path | Description
```

The path must be relative to `TEMPOT_KNOWLEDGE_SOURCES_ROOT`, must not contain
`..`, and must be mounted into the bot container. In local Docker Desktop,
custom definitions are stored in `data/knowledge-custom-profiles.json` through
`TEMPOT_KNOWLEDGE_CUSTOM_PROFILES_FILE`.

## AI Providers

The Knowledge menu includes AI provider controls for super admins. These
controls update dynamic settings only; API keys are still read from runtime
environment variables.

| Capability | Supported providers |
| --- | --- |
| Chat | Gemini, OpenAI, DeepSeek |
| Embeddings | Gemini, OpenAI, Ollama |

Changing the embedding provider or model requires rebuilding the knowledge
index before relying on `/ask` answers. The help assistant uses the same dynamic
embedding settings for retrieval, so indexing and asking stay in one vector
space.

For local free indexing, run Ollama on the host machine and configure the bot
container with:

```env
AI_EMBEDDING_PROVIDER=ollama
AI_EMBEDDING_MODEL=embeddinggemma
AI_EMBEDDING_DIMENSIONS=768
OLLAMA_BASE_URL=http://host.docker.internal:11434
TEMPOT_KNOWLEDGE_MAX_WRITE_CHUNKS=500
```
