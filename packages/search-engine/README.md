# @tempot/search-engine

Typed search planning and state management for Tempot modules.

## Purpose

`@tempot/search-engine` validates module-owned search requests and returns
normalized plans that repositories or adapters can execute. The package does not
execute Prisma clients, render Telegram menus, or call AI providers directly.

## MVP Scope

- Strict contracts for exact and semantic search requests.
- Enum, range, date-range, contains, and boolean filters.
- Relational search plan normalization with pagination metadata.
- Cache-backed search state snapshots with a fixed 30-minute TTL.
- Semantic search planning through injected adapters only.
- i18n message keys for invalid, empty, missing, and expired states.

## Runtime Boundaries

- Persistence execution belongs to repositories or module adapters.
- Cache access is injected through a package port.
- Semantic retrieval is injected through an adapter that may wrap `ai-core`.
- User-facing text is represented by i18n keys only.

## Toggle

The package is enabled by default. Set `TEMPOT_SEARCH_ENGINE=false` to make
fallible public APIs return a typed disabled `AppError`.

## Status

Activated for Spec #014 implementation.
