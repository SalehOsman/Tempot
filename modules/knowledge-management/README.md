# Knowledge Management

`knowledge-management` is the super-admin Telegram operations console for AI/RAG
knowledge indexing. It owns bot UX and delegates all ingestion, retrieval, and
runtime checks to an injected provider from `bot-server`.

The module does not accept arbitrary filesystem paths. Operators choose approved
source profiles only, then run dry-run previews before any write operation.
