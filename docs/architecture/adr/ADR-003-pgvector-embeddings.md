# ADR-003: pgvector for Embedding Storage

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's AI Core requires vector storage for semantic search. Options include dedicated vector databases (Pinecone, Weaviate, Qdrant) or extending the existing PostgreSQL instance.

## Decision

Use **pgvector** as a PostgreSQL extension for vector storage and similarity search.

## Consequences

- No additional infrastructure — vectors live alongside relational data
- HNSW index provides fast approximate nearest neighbour search
- Cosine similarity supported natively
- Managed via Drizzle ORM for type safety (see ADR-017)
- Backup strategy covers both relational and vector data in one operation

## Alternatives Rejected

**Pinecone:** Managed SaaS, additional cost, separate infrastructure to manage, vendor lock-in.

**Weaviate / Qdrant:** Additional Docker container required, separate backup strategy, more operational complexity.

**Raw SQL:** No type safety, fragile queries, violates the Repository Pattern principle.
