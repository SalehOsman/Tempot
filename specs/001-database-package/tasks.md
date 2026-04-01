# Database Package — Task Breakdown

**Feature:** 001-database-package  
**Source:** spec.md (Clarified) + plan.md (Corrected)  
**Generated:** 2026-04-01 (retroactive from implemented code)

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files to create:**

- `packages/database/package.json`
- `packages/database/tsconfig.json`
- `packages/database/.gitignore`
- `packages/database/vitest.config.ts`
- `packages/database/src/index.ts` (barrel)

**Test file:** N/A (infrastructure only)

**Acceptance criteria:**

- [x] `package.json` has correct `main`, `types`, `exports` fields
- [x] `tsconfig.json` extends root config with `"outDir": "dist"`, `"rootDir": "src"`
- [x] `.gitignore` includes `dist/`, `node_modules/`, `*.tsbuildinfo`, compiled artifacts
- [x] `vitest.config.ts` configured with unit and integration test paths
- [x] `src/index.ts` exists as barrel file

---

## Task 1: Base Entity Definition

**Priority:** P0 (dependency for BaseRepository)  
**Estimated time:** 5 min  
**FR:** FR-004 (audit fields via BaseEntity)

**Files to create:**

- `packages/database/src/base/base.entity.ts`

**Test file:** `packages/database/tests/unit/base-entity.test.ts`

**Acceptance criteria:**

- [x] Abstract `BaseEntity` class exported with fields: `id`, `createdAt`, `updatedAt`, `createdBy?`, `updatedBy?`, `isDeleted`, `deletedAt?`, `deletedBy?`
- [x] All fields use TypeScript definite assignment (`!`) or optional (`?`) markers
- [x] Unit test verifies all 8 mandatory and optional audit fields exist on a concrete subclass
- [x] No `any` types
- [x] All tests pass

---

## Task 2: Integration Test Infrastructure (Testcontainers)

**Priority:** P0 (prerequisite for integration tests)  
**Estimated time:** 10 min  
**FR:** SC-004 (Testcontainers integration tests)

**Files to create:**

- `packages/database/src/testing/database.helper.ts`

**Test file:** Validated by integration tests in Tasks 3, 5, 6, 7

**Acceptance criteria:**

- [x] `TestDB` class exported with `start()` and `stop()` lifecycle methods
- [x] Uses `@testcontainers/postgresql` with `pgvector/pgvector:0.8.2-pg16` image
- [x] Creates `Pool` with adapter-pg for Prisma 7 compatibility
- [x] Enables pgvector extension via `CREATE EXTENSION IF NOT EXISTS vector`
- [x] Exposes `prisma` client for direct database assertions in tests
- [x] Properly cleans up pool, client, and container in `stop()`
- [x] SC-004: All integration tests use `TestDB` for PostgreSQL lifecycle

---

## Task 3: Prisma Client with Soft Delete Extensions

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-001, FR-005  
**Dependencies:** Task 0, Task 2

**Files to create:**

- `packages/database/src/prisma/prisma.client.ts`

**Test files:**

- `packages/database/tests/unit/prisma.client.test.ts`
- `packages/database/tests/integration/soft-delete.test.ts`

**Acceptance criteria:**

- [x] FR-001: Prisma 7+ used as primary ORM with `@prisma/adapter-pg` for connection pooling
- [x] FR-005: Soft delete implemented via `$extends()` model extensions (not middleware)
- [x] `delete()` extension converts to `update()` with `isDeleted: true`, `deletedAt: new Date()`
- [x] `deleteMany()` extension converts to `updateMany()` with same soft-delete fields
- [x] `deletedBy` field propagated through `data` argument in delete calls
- [x] Query extensions inject `isDeleted: false` into `findMany`, `findFirst`, `count`
- [x] `findUnique` returns `null` for soft-deleted records (post-query check)
- [x] Client initialized lazily via `Proxy` — no eager connection
- [x] Throws `FATAL` error at startup if `DATABASE_URL` is not set
- [x] SC-001: All CRUD operations are type-safe at compile time
- [x] SC-002: Soft delete is automatic with zero developer overhead
- [x] Unit test verifies FATAL error on missing DATABASE_URL
- [x] Integration tests verify soft delete, deletedBy propagation, findMany filtering, findUnique null return
- [x] No `any` types — uses opaque type aliases and typed interfaces

---

## Task 4: Base Repository with Result Pattern and Audit Log Triggers

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-003, FR-004  
**Dependencies:** Task 1, Task 3

**Files to create:**

- `packages/database/src/base/base.repository.ts`

**Test file:** `packages/database/tests/unit/base-repository.test.ts`

**Acceptance criteria:**

- [x] FR-003: Abstract `BaseRepository<T>` abstracts Prisma complexity from consuming modules
- [x] FR-004: `getContext()` reads `userId` and `userRole` from `@tempot/session-manager` AsyncLocalStorage
- [x] `findById()` returns `Result<T, AppError>` with `isDeleted: false` filter
- [x] `findMany()` returns `Result<T[], AppError>` with `isDeleted: false` filter and optional where clauses
- [x] `create()` populates `createdBy` from session context and triggers audit log
- [x] `update()` captures before/after state and triggers audit log
- [x] `delete()` propagates `deletedBy` from session context and triggers audit log
- [x] `withTransaction()` creates new repository instance bound to transaction client
- [x] `IAuditLogger` interface defined locally to avoid circular dependency with logger package
- [x] `PrismaModelDelegate` opaque type alias uses `object` instead of `any` (PRISMA-BOUNDARY pattern)
- [x] All methods return `Result<T, AppError>` via neverthrow — no thrown exceptions
- [x] Unit tests verify audit logging on create, findMany with/without where, error handling
- [x] No `any` types

---

## Task 5: Drizzle ORM + pgvector Schema and Vector Repository

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-002  
**Dependencies:** Task 0, Task 2

**Files to create:**

- `packages/database/src/drizzle/drizzle.schema.ts`
- `packages/database/src/base/vector.repository.ts`
- `packages/database/src/database.config.ts`
- `packages/database/drizzle.config.ts`

**Test file:** `packages/database/tests/integration/vector-search.test.ts`

**Acceptance criteria:**

- [x] FR-002: Drizzle ORM used for pgvector operations with native vector type safety (ADR-017)
- [x] `embeddings` table defined with columns: `id` (UUID), `contentId`, `contentType`, `vector` (768 dimensions), `metadata` (JSONB)
- [x] HNSW index created on vector column with `vector_cosine_ops` operator class
- [x] Vector dimensions configurable via `DB_CONFIG.VECTOR_DIMENSIONS` (env: `VECTOR_DIMENSIONS`, default: 768)
- [x] Abstract `DrizzleVectorRepository` class with `search()` and `create()` methods
- [x] `search()` uses `cosineDistance` from Drizzle ORM for similarity ordering
- [x] Both methods return `Result<T, AppError>` — no thrown exceptions
- [x] SC-003: Vector similarity search benchmark test validates results ordered by cosine distance (performance test for < 150ms target on production CI)
- [x] Integration test inserts vectors and verifies semantic ordering via cosine similarity
- [x] No `any` types

---

## Task 6: Transaction Manager

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-007  
**Dependencies:** Task 3

**Files to create:**

- `packages/database/src/manager/transaction.manager.ts`

**Test files:**

- `packages/database/tests/unit/transaction-manager.test.ts`
- `packages/database/tests/integration/transaction-repository.test.ts`

**Acceptance criteria:**

- [x] FR-007: `TransactionManager.run()` provides atomic operations across multiple repositories
- [x] Accepts callback `(tx: Prisma.TransactionClient) => Promise<Result<T, AppError>>`
- [x] Rolls back transaction when callback returns `Result.err` (throws error inside `$transaction`)
- [x] Commits transaction when callback returns `Result.ok`
- [x] Returns original `AppError` on business logic failure (not wrapped)
- [x] Returns `database.transaction_failed` error on unexpected failures
- [x] Logs structured JSON to stderr on failure (avoids circular dependency with logger)
- [x] Unit test verifies ok result, rollback on err, structured stderr logging
- [x] Integration test verifies actual database rollback and commit with `BaseRepository.withTransaction()`
- [x] No `any` types

---

## Task 7: AuditLog Schema and Repository

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-003, FR-006  
**Dependencies:** Task 4

**Files to create:**

- `packages/database/prisma/schema.prisma` (AuditLog model)
- `packages/database/src/repositories/audit-log.repository.ts`

**Test file:** `packages/database/tests/integration/audit-log-schema.test.ts`

**Acceptance criteria:**

- [x] AuditLog model defined in Prisma schema with fields: `id`, `userId?`, `userRole?`, `action`, `module`, `targetId?`, `before?` (JSON), `after?` (JSON), `status`, `timestamp`
- [x] `AuditLogRepository` extends `BaseRepository<AuditLog>`
- [x] `create()` overridden to prevent infinite audit loops (does NOT call `this.auditLogger.log`)
- [x] `findById()` overridden to skip `isDeleted` filter (AuditLog has no soft delete)
- [x] `update()` returns error — audit logs are immutable
- [x] `delete()` returns error — audit logs are immutable
- [x] FR-006: Prisma schema supports modular schema merging via `packages/database/scripts/merge-schemas.ts`
- [x] Integration test verifies AuditLog creation with proper field population
- [x] No `any` types

---

## Task 8: Barrel Exports and Final Wiring

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** All (final integration)  
**Dependencies:** Task 1, 3, 4, 5, 6, 7

**Files to update:**

- `packages/database/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [x] Exports: `BaseEntity`, `BaseRepository`, `IAuditLogger`, `PrismaModelDelegate`
- [x] Exports: `DrizzleVectorRepository`
- [x] Exports: `AuditLogRepository`
- [x] Exports: `prisma`, `Prisma`, `PrismaClient` and all `@prisma/client` types
- [x] Exports: `embeddings` (Drizzle schema)
- [x] Exports: `TransactionManager`
- [x] Exports: `DB_CONFIG`
- [x] All existing unit and integration tests still pass after barrel update
- [x] No `any` types in any file across the package

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  ├─→ Task 1 (BaseEntity)     ─┐
  ├─→ Task 2 (TestDB)         ─┤
  │                             ├─→ Task 3 (Prisma Client + Soft Delete)  ─┐
  │                             │                                           ├─→ Task 4 (BaseRepository)  ─┐
  │                             │                                           ├─→ Task 6 (TransactionManager) ─┤
  │                             └─→ Task 5 (Drizzle + pgvector)            │                               ├─→ Task 8 (barrel)
  │                                                                         └─→ Task 7 (AuditLog)          ─┘
  └─→ (all tasks depend on scaffolding)
```

## Summary

| Task      | Name                         | Priority | Est. Time  | FR Coverage    |
| --------- | ---------------------------- | -------- | ---------- | -------------- |
| 0         | Package Scaffolding          | P0       | 5 min      | Infrastructure |
| 1         | Base Entity Definition       | P0       | 5 min      | FR-004         |
| 2         | Test Infrastructure          | P0       | 10 min     | SC-004         |
| 3         | Prisma Client + Soft Delete  | P1       | 15 min     | FR-001, FR-005 |
| 4         | Base Repository              | P1       | 15 min     | FR-003, FR-004 |
| 5         | Drizzle + pgvector           | P2       | 15 min     | FR-002         |
| 6         | Transaction Manager          | P1       | 10 min     | FR-007         |
| 7         | AuditLog Schema + Repository | P1       | 15 min     | FR-003, FR-006 |
| 8         | Barrel Exports               | P1       | 5 min      | All            |
| **Total** |                              |          | **95 min** |                |

---

### Task 8: Blast Radius Assessment (Rule LIV)

**Phase**: 1 (Setup)
**Estimated Duration**: 30 minutes

The database package is shared infrastructure used by every downstream package. Changes to BaseEntity, BaseRepository, or PrismaClient extensions have wide-reaching effects.

#### Acceptance Criteria

- [ ] Document downstream packages that depend on database package exports
- [ ] Identify high-risk interfaces (BaseEntity fields, BaseRepository methods, PrismaClient extensions)
- [ ] Note which changes require coordinated updates across packages
- [ ] Add impact notes to any task that modifies shared interfaces

---

### Task 10: Pluggable Architecture Toggle (Rule XVI) (FR-008)

**Phase**: 1 (Setup)
**Estimated Duration**: 15 minutes

Constitution Rule XVI requires `TEMPOT_DATABASE=true/false` environment variable.

#### Acceptance Criteria

- [ ] Define `TEMPOT_DATABASE` environment variable in database config
- [ ] When disabled, PrismaClient initialization returns err(AppError)
- [ ] Document that disabling database disables all dependent packages
- [ ] Add env var to .env.example

---

### Task 9: Package Readiness Checklist (Rule LXXI)

**Phase**: 0 (Pre-implementation)
**Estimated Duration**: 15 minutes

Verify all 10 points of the Package Readiness Checklist per `docs/developer/package-creation-checklist.md`.

#### Acceptance Criteria

- [ ] All 10 checklist items verified and documented
