# @tempot/database

> Prisma 7.x relational ORM + Drizzle ORM for pgvector. Single source of truth for all persistent state.

## Purpose

- `BaseEntity` -- audit fields: `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `isDeleted`, `deletedAt`, `deletedBy`
- `BaseRepository<T>` -- abstract repository with Result pattern, soft delete, audit log triggers, and `findMany` support
- `DrizzleVectorRepository` -- abstract repository for pgvector similarity search via Drizzle ORM
- Prisma client with global soft delete via `$extends()` (not middleware)
- Drizzle client for pgvector similarity search only (HNSW indexed)
- `TransactionManager` for atomic multi-repository operations
- Modular schema orchestration -- merges `modules/*/database/*.prisma` into central schema

## Dependencies

| Package              | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `prisma` 7.x         | Relational ORM -- migrations, CRUD, soft delete |
| `drizzle-orm` 0.45.x | pgvector operations only                        |
| `@casl/prisma`       | `accessibleBy()` Prisma query integration       |
| `neverthrow`         | `Result<T, AppError>` pattern                   |
| `@tempot/shared`     | `AppError` type                                 |

## API

```typescript
// BaseRepository usage
class InvoiceRepository extends BaseRepository<Invoice> {
  protected moduleName = 'invoices';
  protected entityName = 'invoice';
  protected get model() {
    return this.db.invoice;
  }
}

const repo = new InvoiceRepository(auditLogger);
const result = await repo.findById('id'); // Result<Invoice, AppError>
const list = await repo.findMany({ status: 'PENDING' }); // Result<Invoice[], AppError>
const item = await repo.create(data); // Result<Invoice, AppError>
const upd = await repo.update('id', data); // Result<Invoice, AppError>
const del = await repo.delete('id'); // soft delete -> Result<void, AppError>

// TransactionManager
const result = await TransactionManager.run(async (tx) => {
  const a = await repoA.withTransaction(tx).create(dataA);
  if (a.isErr()) return a;
  return repoB.withTransaction(tx).create(dataB);
});

// DrizzleVectorRepository
class EmbeddingRepo extends DrizzleVectorRepository {}
const vecRepo = new EmbeddingRepo(drizzleDb);
const results = await vecRepo.search(queryVector, 10); // Result<Embedding[], AppError>
```

## Scripts

```bash
pnpm db:merge      # Merge module schemas into central schema.prisma
pnpm db:generate   # db:merge + prisma generate
pnpm db:migrate    # Run pending Prisma migrations
pnpm db:studio     # Open Prisma Studio
pnpm db:reset      # Drop + recreate DB (dev only)
```

## ADRs

- ADR-003 -- pgvector for embeddings
- ADR-017 -- Drizzle ORM for pgvector
- See also: `docs/guides/DUAL-ORM-GUIDE.md`

## Known Issues

- ISSUE-001: `@tempot/database` imports `sessionContext` via deep path `@tempot/session-manager/src/context` to avoid circular dependency. Fix: session-manager should add a subpath export.

## Status

Phase 0 complete. Package is built and tested.
