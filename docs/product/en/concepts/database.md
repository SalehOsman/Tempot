---
title: Database Package
description: Understanding the dual-ORM strategy, repository pattern, and soft-delete mechanism in Tempot
tags:
  - concepts
  - database
  - prisma
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## What is the Database Package?

The `@tempot/database` package manages all data persistence in Tempot. It provides a repository abstraction over two ORMs, automatic soft-delete handling, audit field population, and vector similarity search for AI features.

## Dual-ORM Strategy

Tempot uses two ORMs connecting to the same PostgreSQL 16 database:

| ORM         | Responsibility                                              | Why                                                                                   |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Prisma 7+   | All relational data: CRUD, migrations, schema definition    | Type-safe generated client, schema-first design                                       |
| Drizzle ORM | pgvector operations only: vector storage, similarity search | Prisma lacks native pgvector type support; Drizzle provides native `vector()` columns |

This is not redundant. Prisma handles the relational world with its mature migration system and type generation. Drizzle fills the single gap where Prisma cannot operate: high-dimensional vector columns with HNSW indexing for cosine similarity.

## Repository Pattern

No service in Tempot calls Prisma directly. All database operations flow through `BaseRepository`, an abstract class that enforces consistent behavior:

- Automatic soft-delete filtering on all read queries
- Audit field injection (`createdBy`, `updatedBy`, `deletedBy`) from `AsyncLocalStorage`
- Audit trail logging for every create, update, and delete operation
- Result pattern returns (`Result<T, AppError>`) instead of thrown exceptions
- Transaction support via `withTransaction(tx)`

Subclasses implement three abstract members: `moduleName`, `entityName`, and a `model` getter returning the Prisma delegate.

## Soft-Delete Mechanism

Soft-delete is mandatory across the entire system. It operates at two levels via Prisma Client `$extends()`:

### Write Interception

When code calls `model.delete()`, the Prisma extension intercepts it and converts it to an `update` setting `isDeleted = true` and `deletedAt = new Date()`. Physical deletion never occurs through normal API calls.

### Read Filtering

All `findMany`, `findFirst`, `findUnique`, and `count` queries automatically inject `isDeleted: false` into their where clauses. Soft-deleted records are invisible to application code without any manual filtering.

## Audit Fields

Every entity extends `BaseEntity`, which defines eight standard fields:

| Field       | Auto-Set By                           | Trigger |
| ----------- | ------------------------------------- | ------- |
| `id`        | Prisma schema default                 | INSERT  |
| `createdAt` | Prisma `@default(now())`              | INSERT  |
| `updatedAt` | Prisma `@updatedAt`                   | UPDATE  |
| `createdBy` | `BaseRepository` via `sessionContext` | INSERT  |
| `updatedBy` | `BaseRepository` via `sessionContext` | UPDATE  |
| `isDeleted` | Soft-delete extension                 | DELETE  |
| `deletedAt` | Soft-delete extension                 | DELETE  |
| `deletedBy` | `BaseRepository` via `sessionContext` | DELETE  |

The `sessionContext` (from `@tempot/shared`) carries the current user's identity through `AsyncLocalStorage`, eliminating the need to pass userId through every function call.

## TransactionManager

The `TransactionManager` provides atomic multi-repository operations. It opens a Prisma interactive transaction, passes the transaction client to a callback, and handles rollback automatically when the callback returns a `Result.Err`:

```typescript
import { TransactionManager } from '@tempot/database';

const result = await TransactionManager.run(async (tx) => {
  const userRepo = userRepository.withTransaction(tx);
  const user = await userRepo.create({ name: 'Alice' });
  if (user.isErr()) return user;
  return ok(user.value);
});
```

Each repository's `withTransaction(tx)` method returns a new instance bound to the transaction client, ensuring all operations within the callback share the same database transaction.

## Vector Repository

The `DrizzleVectorRepository` provides cosine similarity search over pgvector embeddings. It uses HNSW indexing with `halfvec` casts to support vectors up to 4000 dimensions (pgvector's default `vector` type caps at 2000 for indexes). The default dimension is 3072, matching common embedding models.

## AuditLogRepository

The `AuditLogRepository` is a special case: it extends `BaseRepository` but overrides key behaviors. Its `create()` method bypasses audit logging to prevent infinite loops (an audit log entry logging itself). Its `update()` and `delete()` methods are blocked entirely, returning errors, because audit records are immutable.
