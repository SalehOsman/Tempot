# Research: AI/RAG Vector Storage Activation

## Decision 1: Use committed raw SQL migration evidence

**Decision**: Add a committed SQL migration that creates the pgvector extension,
the `embeddings` table, and the halfvec HNSW index.

**Rationale**: The current Drizzle schema defines the target shape, and tests can
create it through `TestDB.applyVectorSchema()`. Staging and production still need
committed migration evidence that can be applied without relying on test helpers.

**Alternatives rejected**:

- Rely on test helper SQL only: rejected because test helpers are not production migration evidence.
- Add Prisma model for embeddings: rejected because Drizzle owns pgvector schema.
- Delay storage migration until bot-flow activation: rejected because RAG cannot be staged safely without storage.

## Decision 2: Keep Drizzle as pgvector schema owner

**Decision**: Do not add an `Embedding` Prisma model. The SQL migration aligns
the physical database with the existing Drizzle schema.

**Rationale**: The architecture already assigns pgvector to Drizzle. Adding a
Prisma model would introduce conflicting ownership for a vector-specific table.

## Decision 3: Verify migration evidence with a deterministic unit test

**Decision**: Add a unit test that reads the committed migration SQL and checks
for the required extension, table, vector dimension, and halfvec index.

**Rationale**: This provides fast local regression protection without requiring a
container for every unit run. Existing integration tests already prove vector
search behavior with pgvector.
