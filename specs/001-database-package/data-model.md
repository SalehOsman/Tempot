# Data Model: Database Package

## Entities

### `BaseEntity`

Abstract base class defining mandatory audit fields for all database-persisted entities. Every Prisma model in Tempot inherits these fields.

**Storage:** PostgreSQL via Prisma ORM. Fields mapped to columns in each model's table.

| Field       | Type      | Description                         | Constraints / Validation                             |
| ----------- | --------- | ----------------------------------- | ---------------------------------------------------- |
| `id`        | `string`  | Primary key (UUID or CUID)          | Required, definite assignment (`!`)                  |
| `createdAt` | `Date`    | Timestamp of record creation        | Required, auto-set by Prisma `@default(now())`       |
| `updatedAt` | `Date`    | Timestamp of last update            | Required, auto-set by Prisma `@updatedAt`            |
| `createdBy` | `string?` | User ID who created the record      | Optional, populated from session context             |
| `updatedBy` | `string?` | User ID who last updated the record | Optional, populated from session context             |
| `isDeleted` | `boolean` | Soft delete flag                    | Required, default `false`                            |
| `deletedAt` | `Date?`   | Timestamp of soft deletion          | Optional, set by soft-delete extension               |
| `deletedBy` | `string?` | User ID who deleted the record      | Optional, propagated via delete call `data` argument |

**Implementation:** `packages/database/src/base/base.entity.ts` (10 lines, abstract class).

---

### `AuditLog`

Immutable log entry capturing before/after state of database changes. Defined in Prisma schema.

**Storage:** PostgreSQL table `AuditLog` via Prisma. No soft delete support (records are immutable).

| Field       | Type       | Description                                  | Constraints / Validation                       |
| ----------- | ---------- | -------------------------------------------- | ---------------------------------------------- |
| `id`        | `string`   | Primary key                                  | Required, `@id @default(cuid())`               |
| `userId`    | `string?`  | User who performed the action                | Optional (system actions have no user)         |
| `userRole`  | `string?`  | Role of the user at time of action           | Optional                                       |
| `action`    | `string`   | Action identifier `{module}.{entity}.{verb}` | Required                                       |
| `module`    | `string`   | Module that originated the action            | Required                                       |
| `targetId`  | `string?`  | ID of the affected entity                    | Optional                                       |
| `before`    | `Json?`    | Entity state before mutation                 | Optional, Prisma `Json` type (stored as JSONB) |
| `after`     | `Json?`    | Entity state after mutation                  | Optional, Prisma `Json` type (stored as JSONB) |
| `status`    | `string`   | Outcome of the operation                     | Required, default `"SUCCESS"`                  |
| `timestamp` | `DateTime` | When the action occurred                     | Required, `@default(now())`                    |

**Indexes:** `@@index([module, action])`, `@@index([userId])`.

**Immutability constraints:**

- `AuditLogRepository.update()` returns `Result.err('database.update_not_supported')`
- `AuditLogRepository.delete()` returns `Result.err('database.delete_not_supported')`
- `AuditLogRepository.create()` does NOT trigger audit logging (prevents infinite loops)

**Implementation:** Prisma model in `packages/database/prisma/schema.prisma`, repository in `packages/database/src/repositories/audit-log.repository.ts`.

---

### `Embedding` (Drizzle schema)

Vector embedding for semantic search operations. Defined via Drizzle ORM (not Prisma) per ADR-017.

**Storage:** PostgreSQL table `embeddings` with pgvector extension. Managed by Drizzle schema push (not Prisma migrations).

| Field         | Type        | Description                                 | Constraints / Validation                                |
| ------------- | ----------- | ------------------------------------------- | ------------------------------------------------------- |
| `id`          | `uuid`      | Primary key                                 | Required, `defaultRandom()`                             |
| `contentId`   | `text`      | ID of the content this embedding represents | Required                                                |
| `contentType` | `text`      | Type/category of the content                | Required                                                |
| `vector`      | `vector(N)` | pgvector column for embedding data          | Required, dimensions from `DB_CONFIG.VECTOR_DIMENSIONS` |
| `metadata`    | `jsonb`     | Arbitrary metadata                          | Optional                                                |

**Index:** HNSW index on `vector` column with `vector_cosine_ops` operator class (`embeddings_vector_hnsw_idx`).

**Vector Dimensions:** Configurable via `VECTOR_DIMENSIONS` environment variable, default 768 (Gemini models). Stored in `DB_CONFIG.VECTOR_DIMENSIONS`.

**Implementation:** Drizzle table in `packages/database/src/drizzle/drizzle.schema.ts`, config in `packages/database/src/database.config.ts`.

---

## Relationships

```
BaseEntity (abstract)
  └── inherited by all Prisma models (User, etc.)
        └── CRUD operations trigger → AuditLog entries

Embedding (standalone Drizzle table)
  └── no FK relationships — linked to content via contentId/contentType
```

- `AuditLog.targetId` is a logical reference to any entity's `id` (not enforced as FK).
- `Embedding.contentId` is a logical reference to any content entity (not enforced as FK).
- `BaseEntity` fields (`createdBy`, `updatedBy`, `deletedBy`) reference user IDs but are not FK-constrained.

## Storage Mechanisms

### Prisma ORM (Primary)

- **Scope:** All relational and structural data — entities inheriting from `BaseEntity`, `AuditLog`.
- **Connection:** `@prisma/adapter-pg` with `pg.Pool` for connection pooling. Lazy initialization via `Proxy`.
- **Extensions:** Model extensions for soft delete (`delete` -> `update`), query extensions for global `isDeleted: false` filtering.
- **Schema location:** `packages/database/prisma/schema.prisma`.
- **Modular schemas:** Module-specific schemas merged via `packages/database/scripts/merge-schemas.ts`.

### Drizzle ORM (pgvector only)

- **Scope:** Vector embeddings table only (ADR-017).
- **Connection:** Direct `drizzle(pool)` with `drizzle-orm/node-postgres`.
- **Schema location:** `packages/database/src/drizzle/drizzle.schema.ts`.
- **Config:** `packages/database/drizzle.config.ts`.

### Test Infrastructure

- **Testcontainers:** `pgvector/pgvector:0.8.2-pg16` Docker image.
- **Helper:** `packages/database/src/testing/database.helper.ts` — `TestDB` class manages container lifecycle.
- **Schema push:** Integration tests use `prisma db push` or `drizzle-kit push` (not migrations) for test schema setup.

## Data Flow

```
Session Middleware (upstream)
  └─ writes userId/userRole to sessionContext (AsyncLocalStorage)
       └─ BaseRepository.getContext() reads from it
            ├─ create() → sets createdBy, triggers AuditLog
            ├─ update() → sets updatedBy, captures before/after, triggers AuditLog
            └─ delete() → sets deletedBy, triggers AuditLog

Prisma Client (with extensions)
  ├─ delete()    → converted to update() with isDeleted=true, deletedAt, deletedBy
  ├─ findMany()  → auto-injects where: { isDeleted: false }
  ├─ findFirst() → auto-injects where: { isDeleted: false }
  ├─ findUnique()→ post-query null return if isDeleted=true
  └─ count()     → auto-injects where: { isDeleted: false }

TransactionManager.run(callback)
  └─ prisma.$transaction(async (tx) => ...)
       └─ callback receives tx
            └─ repo.withTransaction(tx) creates transaction-bound repository
                 ├─ Result.ok → commit
                 └─ Result.err → throw → rollback

Drizzle (vector operations)
  └─ DrizzleVectorRepository
       ├─ search(vec, limit) → SELECT ... ORDER BY cosineDistance ... LIMIT
       └─ create(data)       → INSERT INTO embeddings ... RETURNING
```
