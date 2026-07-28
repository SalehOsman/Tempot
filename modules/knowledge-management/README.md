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

## Custom Profiles

Super admins can add a mounted custom source from the bot:

```text
/knowledge_custom Name | relative/path | Description
```

The path must be relative to `TEMPOT_KNOWLEDGE_SOURCES_ROOT`, must not contain
`..`, and must be mounted into the bot container. In local Docker Desktop,
custom definitions are stored in `data/knowledge-custom-profiles.json` through
`TEMPOT_KNOWLEDGE_CUSTOM_PROFILES_FILE`.
