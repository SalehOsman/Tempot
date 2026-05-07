# ADR-015: Prisma where Builder in Search Engine

**Date:** 2026-03-19
**Status:** Accepted

## Context

The search-engine package needs to build dynamic database queries from user-provided filters (date ranges, enums, text contains, boolean flags). v10 built a separate Filter Builder abstraction layer that translated filter objects into SQL.

## Decision

Build filters directly as **Prisma `where` conditions** inside search-engine, without an intermediate abstraction layer.

## Consequences

- Prisma's TypeScript types provide compile-time validation of filter conditions
- No translation layer — filter objects are Prisma-native
- `accessibleBy(ability)` from CASL integrates directly into Prisma `where` conditions
- Semantic search via ai-core adds an `OR` clause to the same `where` object
- Simpler codebase — one layer instead of two

## Alternatives Rejected

**Custom Filter Builder (v10 approach):** A separate DSL that translated to SQL. Duplicated Prisma's type system. Two places to update when adding a new filterable field. TypeScript types were looser.

**Raw SQL:** Loses type safety. SQL injection risk. Harder to compose with CASL's `accessibleBy`.
