# ADR-017: Drizzle ORM for pgvector Operations

**Date:** 2026-03-19
**Status:** Accepted

## Context

pgvector operations (storing embeddings, cosine similarity search) require native vector type support. Prisma does not support pgvector natively — raw SQL is the only option with Prisma for vector queries.

## Decision

Use **Drizzle ORM v0.45.x** exclusively for pgvector operations, alongside Prisma for all other database operations.

## Consequences

- `vector()` column type with full TypeScript type safety in Drizzle
- `cosineDistance()`, `l2Distance()` functions available as typed operations
- HNSW index creation via Drizzle migrations
- Dual ORM: Prisma handles everything except vector columns
- See `docs/guides/DUAL-ORM-GUIDE.md` for usage patterns and anti-patterns

## Critical Warning

Embedding models from different providers are incompatible. Changing the embedding model or `TEMPOT_AI_PROVIDER` may require full re-indexing of all vector data. Keep re-indexing strategy documentation under `docs/archive/architecture/` when it is formalized.

## Alternatives Rejected

**Raw SQL with Prisma ($queryRaw):** No type safety. Vector types are opaque strings. Fragile to SQL injection if not carefully parameterised. Every vector query is boilerplate.

**Separate vector database (Pinecone, Qdrant):** Additional infrastructure, separate backup strategy, more operational complexity, additional cost.
