---
title: Using the Database Package
description: Practical guide to repositories, transactions, soft-delete, and vector search in Tempot
tags:
  - guide
  - database
  - prisma
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Overview

The `@tempot/database` package enforces the repository pattern for all data access. This guide covers extending `BaseRepository` for your entities, using transactions, working with soft-delete behavior, and performing vector similarity searches.

## Extending BaseRepository

Create a concrete repository by extending `BaseRepository` and implementing three abstract members:

```typescript
import { BaseRepository, prisma, type IAuditLogger } from '@tempot/database';
import type { Invoice } from '@prisma/client';

export class InvoiceRepository extends BaseRepository<Invoice> {
  protected moduleName = 'invoices';
  protected entityName = 'invoice';

  constructor(auditLogger: IAuditLogger) {
    super(auditLogger);
  }

  protected get model() {
    return this.db.invoice;
  }
}
```

The base class provides `findById`, `findMany`, `create`, `update`, and `delete` methods, all returning `Result<T, AppError>`. Audit fields (`createdBy`, `updatedBy`, `deletedBy`) are populated automatically from `sessionContext`.

## Adding Custom Queries

Add domain-specific queries as methods on your repository subclass:

```typescript
export class InvoiceRepository extends BaseRepository<Invoice> {
  // ... abstract members

  async findByCustomer(customerId: string): Promise<Result<Invoice[], AppError>> {
    return this.findMany({ customerId });
  }

  async findOverdue(): Promise<Result<Invoice[], AppError>> {
    return this.findMany({
      dueDate: { lt: new Date() },
      status: 'PENDING',
    });
  }
}
```

The `findMany` method automatically applies `isDeleted: false` filtering, so your custom queries never return soft-deleted records.

## Using TransactionManager

Wrap multi-repository operations in `TransactionManager.run()` for atomicity:

```typescript
import { TransactionManager } from '@tempot/database';
import { ok } from 'neverthrow';

const result = await TransactionManager.run(async (tx) => {
  const invoiceRepo = invoiceRepository.withTransaction(tx);
  const paymentRepo = paymentRepository.withTransaction(tx);

  const invoice = await invoiceRepo.create({ amount: 500, customerId: 'c_1' });
  if (invoice.isErr()) return invoice;

  const payment = await paymentRepo.create({
    invoiceId: invoice.value.id,
    amount: 500,
  });
  if (payment.isErr()) return payment;

  return ok(invoice.value);
});
```

Each `withTransaction(tx)` call returns a new repository instance bound to the transaction client. If any step returns `Result.Err`, the transaction rolls back automatically.

## Understanding Soft-Delete

Soft-delete is enforced globally via Prisma client extensions. You do not need to handle it manually.

### What Happens on Delete

When your repository calls `delete(id)`, the Prisma extension converts it to:

```typescript
// Your code calls:
await invoiceRepo.delete('inv_123');

// Prisma extension executes:
// UPDATE invoices SET "isDeleted" = true, "deletedAt" = NOW() WHERE id = 'inv_123'
```

Physical deletion never occurs through the repository API.

### What Happens on Read

All read queries automatically inject `isDeleted: false`:

```typescript
// Your code calls:
await invoiceRepo.findMany({ status: 'PENDING' });

// Prisma extension adds:
// WHERE status = 'PENDING' AND "isDeleted" = false
```

Soft-deleted records are invisible to all application code without any manual filtering.

## Working with Audit Fields

The `BaseEntity` defines eight standard fields. Six are managed automatically:

| Field       | Set By                 | When   |
| ----------- | ---------------------- | ------ |
| `id`        | Prisma default         | INSERT |
| `createdAt` | Prisma `@default(now)` | INSERT |
| `updatedAt` | Prisma `@updatedAt`    | UPDATE |
| `createdBy` | `sessionContext`       | INSERT |
| `updatedBy` | `sessionContext`       | UPDATE |
| `deletedBy` | `sessionContext`       | DELETE |

The repository reads the current user from `sessionContext` (set at the middleware boundary) and injects it into the appropriate field. No manual attribution is needed.

## Using the Vector Repository

For AI-powered similarity search, extend `DrizzleVectorRepository`:

```typescript
import { DrizzleVectorRepository } from '@tempot/database';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class DocumentVectorRepo extends DrizzleVectorRepository {
  constructor(db: NodePgDatabase) {
    super(db);
  }
}
```

Store and search embeddings:

```typescript
// Store an embedding
const createResult = await vectorRepo.create({
  sourceId: 'doc_123',
  sourceType: 'document',
  content: 'Original text chunk',
  embedding: vectorArray, // number[] with 3072 dimensions
});

// Search by similarity
const searchResult = await vectorRepo.search(queryVector, 10);
if (searchResult.isOk()) {
  const similar = searchResult.value; // top 10 matches by cosine similarity
}
```

The repository uses HNSW indexing with `halfvec` casts, supporting vectors up to 4000 dimensions. The default dimension is 3072, configured via `DB_CONFIG.VECTOR_DIMENSIONS`.

## Implementing IAuditLogger

Every `BaseRepository` requires an `IAuditLogger` for audit trail logging. Provide the `AuditLogger` from `@tempot/logger`:

```typescript
import { AuditLogRepository } from '@tempot/database';
import { AuditLogger } from '@tempot/logger';

const auditLogRepo = new AuditLogRepository({
  log: async () => {},
});
const auditLogger = new AuditLogger(auditLogRepo);

const invoiceRepo = new InvoiceRepository(auditLogger);
```

The `AuditLogRepository` itself takes a no-op audit logger to prevent infinite recursion (an audit log entry logging itself).

## Best Practices

- Never call Prisma directly in service code; always go through a repository
- Use `withTransaction(tx)` to bind repositories to a shared transaction
- Let soft-delete and audit fields work automatically via extensions and `sessionContext`
- Implement domain queries as repository methods, not as raw Prisma calls in services
