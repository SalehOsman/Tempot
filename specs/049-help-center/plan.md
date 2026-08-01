# Implementation Plan: help-center

Implement an active core-platform module that owns help navigation, support
content, and a governed AI/RAG assistant entry point.

The module owns only Telegram UX, command parsing, i18n rendering, and the
provider contract. Runtime AI composition remains in `apps/bot-server` so the
module does not import infrastructure packages directly. `bot-server` injects a
`HelpAssistantProvider` backed by `@tempot/ai-core` RAG retrieval, PostgreSQL
pgvector storage, the configured AI provider registry, resilience service, and
the module event-bus adapter.

The first production-safe slice is retrieval-grounded: it returns the most
relevant authorized context snippet with citations. Generative answer synthesis
can be added later behind the same provider contract after separate prompt,
cost, leakage, and evaluation gates are specified.
