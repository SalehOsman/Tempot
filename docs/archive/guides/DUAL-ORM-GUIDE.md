# Dual ORM Guide — Prisma + Drizzle

> Reference: Spec v11, Section 17.5 — ADR-017

---

## Overview

Tempot uses two ORMs with distinct responsibilities:

| ORM             | Responsibility                                                        | Location                         |
| --------------- | --------------------------------------------------------------------- | -------------------------------- |
| **Prisma 7.x**  | All relational data — CRUD, migrations, soft delete, CASL integration | `packages/database/src/prisma/`  |
| **Drizzle ORM** | pgvector operations only — embeddings storage and similarity search   | `packages/database/src/drizzle/` |

> ⚠️ **Never mix responsibilities.** If you find yourself writing a Prisma `$queryRaw` for a vector operation, use Drizzle instead. If you find yourself using Drizzle for a regular table, use Prisma instead.

---

## Decision Tree

```
Do you need to query a vector column?
  YES → Use Drizzle
  NO  → Use Prisma
```

That is the entire decision tree. Everything else is Prisma.

---

## Prisma Patterns

### BaseRepository (mandatory pattern)

All database access goes through a Repository that extends `BaseRepository`. Direct Prisma calls in services or handlers are forbidden (Constitution Rule XIV).

```typescript
// packages/database/src/base/base.repository.ts
export abstract class BaseRepository<T> {
  protected abstract model: any;
  protected abstract moduleName: string;
  protected abstract entityName: string;

  async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.model.findUnique({
        where: { id, isDeleted: false },
      });
      if (!item) return err(new AppError(`${this.moduleName}.not_found`));
      return ok(item as T);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.db_error`, e));
    }
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<Result<T, AppError>> {
    const ctx = sessionContext.getStore();
    try {
      const item = await this.model.create({
        data: { ...data, createdBy: ctx?.userId },
      });
      await this.auditLogger.log({ action: 'create', module: this.moduleName, after: item });
      return ok(item as T);
    } catch (e) {
      return err(new AppError(`${this.moduleName}.create_failed`, e));
    }
  }
}
```

### Soft Delete (automatic via Prisma extension)

Soft delete is applied globally via `prisma.$extends()`. Never call `prisma.model.delete()` directly — it is intercepted and converted to an update with `isDeleted: true`.

```typescript
// Correct — triggers soft delete automatically
await prisma.invoice.delete({ where: { id } });
// Result: { isDeleted: true, deletedAt: Date, deletedBy: userId }

// Also correct — finds only non-deleted records automatically
await prisma.invoice.findMany();
// WHERE isDeleted = false is injected automatically
```

### CASL + Prisma Integration

```typescript
import { accessibleBy } from '@casl/prisma';

// In repository — CASL filters the query automatically
const invoices = await prisma.invoice.findMany({
  where: {
    ...accessibleBy(ability, 'read').Invoice,
    // Additional filters
    status: 'PENDING',
  },
});
```

### TransactionManager

For operations spanning multiple repositories:

```typescript
import { TransactionManager } from '@tempot/database';

const result = await TransactionManager.run(async (tx) => {
  const invoice = await invoiceRepo.createWithTx(tx, invoiceData);
  if (invoice.isErr()) return invoice;

  const payment = await paymentRepo.createWithTx(tx, paymentData);
  if (payment.isErr()) return payment;

  return ok({ invoice: invoice.value, payment: payment.value });
});
```

If either operation returns `err()`, the transaction rolls back automatically.

---

## Drizzle Patterns

### Schema Definition

```typescript
// packages/database/src/drizzle/schema.ts
import { pgTable, uuid, vector, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(), // 'invoice' | 'user' | 'product'
  vector: vector('vector', { dimensions: 1536 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Storing an Embedding

```typescript
// packages/ai-core/src/embedding/embedding.service.ts
import { db } from '@tempot/database/drizzle';
import { embeddings } from '@tempot/database/drizzle/schema';

async function storeEmbedding(
  contentId: string,
  contentType: string,
  embedding: number[],
  metadata?: Record<string, unknown>,
): Promise<Result<void, AppError>> {
  try {
    await db.insert(embeddings).values({
      contentId,
      contentType,
      vector: embedding,
      metadata,
    });
    return ok(undefined);
  } catch (e) {
    return err(new AppError('ai.embedding.store_failed', e));
  }
}
```

### Similarity Search

```typescript
import { cosineDistance, sql } from 'drizzle-orm';

async function searchSimilar(
  queryVector: number[],
  contentType: string,
  limit = 10,
): Promise<Result<SimilarityResult[], AppError>> {
  try {
    const results = await db
      .select({
        contentId: embeddings.contentId,
        distance: cosineDistance(embeddings.vector, queryVector),
      })
      .from(embeddings)
      .where(eq(embeddings.contentType, contentType))
      .orderBy(cosineDistance(embeddings.vector, queryVector))
      .limit(limit);

    return ok(results);
  } catch (e) {
    return err(new AppError('ai.search.failed', e));
  }
}
```

### HNSW Index (in Drizzle migration)

```typescript
// packages/database/src/drizzle/migrations/0001_add_hnsw_index.ts
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  await db.execute(sql`
    CREATE INDEX embeddings_vector_hnsw_idx
    ON embeddings
    USING hnsw (vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 200)
  `);
}
```

---

## Anti-Patterns

### ❌ Never use Prisma $queryRaw for vectors

```typescript
// WRONG — use Drizzle instead
const results = await prisma.$queryRaw`
  SELECT * FROM embeddings
  ORDER BY vector <-> ${queryVector}::vector
  LIMIT 10
`;
```

### ❌ Never use Drizzle for regular tables

```typescript
// WRONG — use Prisma (and BaseRepository) instead
const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.userId, userId));
```

### ❌ Never call prisma directly in a service

```typescript
// WRONG — use repository instead
class InvoiceService {
  async getInvoice(id: string) {
    return prisma.invoice.findUnique({ where: { id } }); // ❌ direct call
  }
}
```

```typescript
// CORRECT
class InvoiceService {
  constructor(private repo: InvoiceRepository) {}

  async getInvoice(id: string): Promise<Result<Invoice, AppError>> {
    return this.repo.findById(id); // ✅ through repository
  }
}
```

---

## Coordinating Transactions Across Both ORMs

Prisma and Drizzle use separate connection pools and cannot participate in the same database transaction. When you need to store both a Prisma record and a Drizzle embedding atomically:

**Strategy:** Use a compensating transaction pattern.

```typescript
// 1. Store the Prisma record first
const invoiceResult = await invoiceRepo.create(data);
if (invoiceResult.isErr()) return invoiceResult;

// 2. Store the embedding
const embeddingResult = await embeddingService.store(invoiceResult.value.id, 'invoice', embedding);

// 3. If embedding fails, delete the Prisma record (compensate)
if (embeddingResult.isErr()) {
  await invoiceRepo.hardDelete(invoiceResult.value.id); // admin-only hard delete
  return err(new AppError('invoice.embedding_failed'));
}
```

For non-critical embeddings (search enhancement), failure to store the embedding should not roll back the main record. Log the error and continue.
