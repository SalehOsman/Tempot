# Research: Search Engine Package

**Feature**: 014-search-engine-package
**Repaired**: 2026-05-06

## Key Decisions

### D1: Build plans, do not execute persistence

`search-engine` validates requests and builds normalized search plans. Repositories or
module-owned adapters execute persistence work. This keeps package services away from
direct Prisma access.

### D2: Use explicit filter value types

Filter values are modeled as discriminated unions by filter category. This avoids `any`
while still supporting enum, range, date range, contains, and boolean filters.

### D3: Cache through an injected adapter

The package depends on a cache capability rather than a concrete Redis client. This keeps
tests deterministic and aligns with cache-manager usage.

### D4: Semantic search is adapter-driven

Semantic search planning delegates embedding and retrieval behavior to injected adapters
that can wrap `ai-core` contracts. The package does not call providers directly.

## Alternatives Rejected

### Direct Prisma execution inside `search-engine`

Rejected because services and handlers must not access Prisma directly. Repository or
adapter layers own persistence execution.

### Hardwired Telegram menu rendering

Rejected for the package MVP because UI rendering would couple search planning to one bot
surface. The package exposes metadata that bot UI layers can render with i18n keys.

### Direct AI provider integration

Rejected because the project already centralizes AI behavior in `ai-core`.

## Dependency Notes

No new third-party dependency is required for the relational MVP. Semantic behavior should
use existing workspace contracts unless a later research update proves a dependency is
necessary.
