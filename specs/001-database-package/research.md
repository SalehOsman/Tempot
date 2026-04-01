# Research: Database Package

## Decisions

### 1. Primary ORM: Prisma 7

- **Decision:** Use Prisma 7 with `@prisma/adapter-pg` as the primary ORM for all relational and structural data.
- **Rationale:** Prisma provides type-safe database access with generated TypeScript types, schema-first design, and migration tooling. Version 7 introduces the adapter-pg driver for connection pooling via `pg.Pool`, replacing the previous binary engine. Selected per the constitution's locked tech stack.
- **Alternatives considered:** Drizzle ORM for everything (rejected — Drizzle lacks the schema-first migration workflow needed for enterprise projects). TypeORM (rejected — not in the locked tech stack, decorator-heavy API conflicts with TypeScript strict mode). Knex (rejected — query builder without ORM features, no type generation).

### 2. Vector ORM: Drizzle for pgvector

- **Decision:** Use Drizzle ORM exclusively for pgvector operations. Prisma handles everything else.
- **Rationale:** Prisma does not natively support pgvector column types or pgvector-specific operators (`cosineDistance`, HNSW indexes). Drizzle has first-class pgvector support via `drizzle-orm/pg-core` with `vector()` column type and `cosineDistance()` function. ADR-017 mandates this dual-ORM approach.
- **Alternatives considered:** Raw SQL for vector operations (rejected — loses type safety and composability). Prisma with `$queryRaw` for vector ops (rejected — no type safety on vector columns, brittle string interpolation). Single ORM (rejected — neither Prisma nor Drizzle alone covers all requirements).

### 3. Soft Delete Strategy

- **Decision:** Implement soft delete globally via Prisma Client `$extends()` model and query extensions.
- **Rationale:** Constitution Rule XXVII mandates soft delete. Using `$extends()` (not middleware) ensures soft delete is applied at the model level without opt-in from consumers. The model extension overrides `delete()` to call `update()` with `isDeleted: true`, `deletedAt: new Date()`. Query extensions inject `isDeleted: false` into all read queries. This approach is transparent to consuming code.
- **Alternatives considered:** Prisma middleware (rejected — deprecated in Prisma 5+, does not work in Prisma 7). Manual soft delete in each repository (rejected — error-prone, violates DRY). Database triggers (rejected — less portable, harder to test, hides business logic).

### 4. Connection Initialization

- **Decision:** Lazy initialization via JavaScript `Proxy`. The `prisma` export is a Proxy that defers `getPrismaClient()` until first property access.
- **Rationale:** Avoids eager database connection during module import, which would fail in test environments where `DATABASE_URL` may not be set until the test fixture starts. The Proxy pattern also allows module-level exports without top-level async.
- **Alternatives considered:** Factory function `createPrismaClient()` (rejected — requires explicit initialization at every import site). Top-level `await` (rejected — not supported in all module contexts). Global initialization in `main()` (rejected — database package must be importable independently).

### 5. Repository Pattern

- **Decision:** Abstract `BaseRepository<T>` class with `PrismaModelDelegate` opaque type alias.
- **Rationale:** Constitution Rule XIV mandates the Repository Pattern. `BaseRepository` provides `findById`, `findMany`, `create`, `update`, `delete` with consistent error handling and audit logging. The `PrismaModelDelegate` type uses `object` (not `any`) as a constraint — Prisma 7's delegate types use deeply branded generics that cannot be expressed as a simple interface. Type assertions happen at a single call boundary (the private `delegate` accessor).
- **Alternatives considered:** Generic interface `IRepository<T>` (rejected — Prisma's delegate typing makes interface-based generics impractical). Direct Prisma calls in services (rejected — violates Rule XIV). `any`-typed delegates (rejected — violates Rule X, no `any` allowed).

### 6. Audit Logging Integration

- **Decision:** `BaseRepository` triggers audit log entries via an `IAuditLogger` interface injected through the constructor.
- **Rationale:** Constitution Rule LVII mandates audit logging. The `IAuditLogger` interface is defined locally in `base.repository.ts` to avoid circular dependency with `@tempot/logger` (which imports `AuditLogRepository` from this package). `AuditLogRepository` overrides `create()` to skip audit logging (preventing infinite recursion).
- **Alternatives considered:** Event-driven audit logging via Event Bus (considered for future — current implementation uses direct injection for simplicity). Prisma middleware for automatic audit logging (rejected — middleware is deprecated in Prisma 7). Decorator-based audit logging (rejected — requires experimental TypeScript decorators).

### 7. Transaction Management

- **Decision:** Static `TransactionManager.run()` method wrapping Prisma's `$transaction()` with Result pattern integration.
- **Rationale:** FR-007 requires atomic multi-repository operations. The manager accepts a callback that receives `Prisma.TransactionClient`, returns `Result<T, AppError>`, and automatically triggers rollback when the result is `Err`. Error logging uses `process.stderr.write(JSON.stringify(...))` instead of `@tempot/logger` to avoid circular dependency.
- **Alternatives considered:** Unit of Work pattern (rejected — over-engineering for current needs). Manual try/catch with `$transaction` in each service (rejected — inconsistent error handling). Saga pattern (rejected — no distributed transactions needed at this stage).

### 8. Vector Dimensions

- **Decision:** Default 768 dimensions (Gemini models), configurable via `VECTOR_DIMENSIONS` environment variable.
- **Rationale:** Gemini embedding models produce 768-dimensional vectors. The plan originally specified 1536 dimensions (OpenAI's `text-embedding-3-large`), but the project uses Gemini as the primary AI provider (ADR-003).
- **Alternatives considered:** Fixed 1536 dimensions (rejected — matches OpenAI, not the project's Gemini models). Dynamic dimensions per embedding (rejected — pgvector requires fixed dimensions per column for HNSW indexing).

### 9. Test Infrastructure

- **Decision:** `TestDB` class using `@testcontainers/postgresql` with `pgvector/pgvector:0.8.2-pg16` Docker image, located in `packages/database/src/testing/database.helper.ts`.
- **Rationale:** SC-004 mandates Testcontainers for integration tests. The helper manages container lifecycle (`start`/`stop`), enables pgvector extension, and provides a raw `PrismaClient` for assertions that bypass soft-delete extensions. Placed in `src/testing/` (not `tests/utils/`) for exportability to other packages' integration tests.
- **Alternatives considered:** In-memory SQLite (rejected — no pgvector support, incompatible with PostgreSQL-specific features). Shared test database (rejected — parallel test runs cause conflicts). Test fixtures with mocked Prisma (rejected — misses integration issues).

### 10. Result Pattern

- **Decision:** All public repository and manager methods return `Result<T, AppError>` via `neverthrow 8.2.0`. Zero thrown exceptions in public APIs.
- **Rationale:** Strict adherence to Constitution Rule XXI. Error codes use hierarchical module-scoped strings: `database.not_found`, `database.create_failed`, `database.transaction_failed`, `database.vector_search_failed`. The `AppError` class from `@tempot/shared` carries the error message and optional cause.
- **Alternatives considered:** None — Rule XXI is non-negotiable.

## Implementation Divergences from Plan

| Aspect                | Plan                                         | Actual Code                                                       | Rationale                                             |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Vector dimensions     | 1536 (OpenAI)                                | 768 (Gemini), configurable via env                                | Project uses Gemini models per ADR-003                |
| Prisma client file    | `packages/database/src/prisma/client.ts`     | `packages/database/src/prisma/prisma.client.ts`                   | Follows Rule III naming convention                    |
| Drizzle schema file   | `packages/database/src/drizzle/schema.ts`    | `packages/database/src/drizzle/drizzle.schema.ts`                 | Follows Rule III naming convention                    |
| TestDB location       | `packages/database/tests/utils/test-db.ts`   | `packages/database/src/testing/database.helper.ts`                | Exported for use by other packages' integration tests |
| Container image       | `ankane/pgvector:latest`                     | `pgvector/pgvector:0.8.2-pg16`                                    | Official pgvector image, pinned version               |
| Prisma connection     | `new PrismaClient()`                         | `PrismaClient` + `@prisma/adapter-pg` + `pg.Pool`                 | Prisma 7 requires adapter-pg for driver-based access  |
| Initialization        | Direct instantiation                         | Lazy via `Proxy`                                                  | Avoids eager connection during import                 |
| Delegate typing       | `PrismaDelegate` (implied `any`)             | `PrismaModelDelegate = object` with PRISMA-BOUNDARY               | Avoids `any` per Rule X                               |
| Audit logger          | Direct `AuditLogger` class import            | `IAuditLogger` local interface                                    | Avoids circular dependency with logger package        |
| Error logging         | Not specified                                | `process.stderr.write(JSON.stringify(...))` in TransactionManager | Cannot import logger (circular dependency)            |
| Schema merging script | `packages/database/scripts/merge-schemas.ts` | Same (exists on disk)                                             | Implemented as planned                                |
