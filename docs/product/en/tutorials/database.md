---
title: Creating a Repository
description: Step-by-step tutorial to create a complete database repository for a new entity in Tempot
tags:
  - tutorial
  - database
  - repository
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
lastVerified: 2026-07-22
---

## Prerequisites

Before you begin, make sure you have:

- A working Tempot development environment (see [Getting Started](/en/tutorials/getting-started/))
- PostgreSQL 16 running with the Tempot database migrated
- Basic understanding of Prisma and TypeScript

This tutorial was verified against the active modular schema merge and Prisma 7
workflow on 2026-07-22.

If an entity contains classified identity, contact, credential, or payment
data, stop before adding it to the model and define its protected envelope,
lookup requirements, and migration plan. `BaseRepository` audit snapshots use
an explicit allowlist rather than preserving unknown fields, but persistence
protection remains the concrete repository's responsibility.

## Building a Task Repository

In this tutorial you will create a complete `Task` entity with a Prisma model, a repository, and transactional operations.

### Step 1: Define the Prisma Model

Add a `Task` model to your module's `schema.prisma` file. It must include the eight `BaseEntity` fields:

```prisma
model Task {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  isDeleted Boolean  @default(false)
  deletedAt DateTime?
  deletedBy String?

  title     String
  status    String   @default("PENDING")
  assignee  String?
}
```

Run `pnpm --filter @tempot/database db:generate`, then
`pnpm --filter @tempot/database db:migrate --name add-task` to merge module
schemas, regenerate the client, and create the migration.

### Step 2: Create the Repository Class

Extend `BaseRepository` and implement the three required abstract members:

```typescript
import { BaseRepository, type IAuditLogger } from '@tempot/database';
import type { Task } from '@prisma/client';

export class TaskRepository extends BaseRepository<Task> {
  protected moduleName = 'tasks';
  protected entityName = 'task';

  constructor(auditLogger: IAuditLogger) {
    super(auditLogger);
  }

  protected get model() {
    return this.db.task;
  }
}
```

This gives you public `findById`, `create`, `update`, and `delete` operations.
The protected `findMany` helper is available for purpose-specific methods
inside the repository.

Do not pass classified plaintext to these generic methods. Follow the
`UserRepository` pattern: protect the value first, persist the envelope and
approved token atomically, and return recovered values only through an
authorized domain mapping.

For searchable protected fields, generate exact tokens for every readable key
version and query the indexed token column with `IN`. Do not implement a
rotation fallback that scans or decrypts unrelated records.

If your use case is a startup bootstrap operation rather than a normal domain
entity, still keep the Prisma access inside `@tempot/database`. Follow the
`BootstrapSessionRepository` pattern: expose a small input contract, perform the
upsert in the database package, and return `Result<void, AppError>`.

### Step 3: Add a Custom Query

Add a domain-specific method to find tasks by assignee:

```typescript
export class TaskRepository extends BaseRepository<Task> {
  // ... abstract members from Step 2

  async findByAssignee(assignee: string) {
    return this.findMany({ assignee });
  }
}
```

The protected `findMany` base method enforces the active-record scope after
your criteria, so the method cannot expose soft-deleted records through a
conflicting filter.

### Step 4: Instantiate with an Audit Logger

Create the repository with an `AuditLogger` from `@tempot/logger`:

```typescript
import { AuditLogRepository } from '@tempot/database';
import { AuditLogger } from '@tempot/logger';

const auditLogRepo = new AuditLogRepository({ log: async () => {} });
const auditLogger = new AuditLogger(auditLogRepo);
const taskRepo = new TaskRepository(auditLogger);
```

### Step 5: Use the Repository

All operations return `Result<T, AppError>`. Handle both outcomes:

```typescript
const createResult = await taskRepo.create({
  title: 'Review pull request',
  assignee: 'user_123',
});

if (createResult.isErr()) {
  // Handle error — createResult.error is an AppError
  return createResult;
}

const task = createResult.value;
// task.createdBy is auto-populated from sessionContext
```

### Step 6: Use Transactions

Wrap multi-step operations in `TransactionManager.run()`:

```typescript
import { TransactionManager } from '@tempot/database';
import { ok } from 'neverthrow';

const result = await TransactionManager.run(async (tx) => {
  const txRepo = taskRepo.withTransaction(tx);

  const task = await txRepo.create({ title: 'Deploy v2', assignee: 'user_1' });
  if (task.isErr()) return task;

  const updated = await txRepo.update(task.value.id, { status: 'IN_PROGRESS' });
  if (updated.isErr()) return updated;

  return ok(updated.value);
});
```

If any step fails, the entire transaction rolls back automatically.

## What You Built

You created a complete data access layer that:

- Extends `BaseRepository` with automatic soft-delete and audit field population
- Adds custom domain queries that inherit all base behavior
- Uses `TransactionManager` for atomic multi-step operations
- Returns `Result<T, AppError>` from every method

## Next Steps

- Read the [Database Concepts](/en/concepts/database/) to understand the dual-ORM strategy
- See the [Using the Database Package](/en/guides/database/) guide for vector search and advanced queries
- Learn how to add logging in the [Logger Tutorial](/en/tutorials/logger/)
