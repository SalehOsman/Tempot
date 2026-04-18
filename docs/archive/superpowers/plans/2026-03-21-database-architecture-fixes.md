# Database Package Architectural Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address architectural issues identified in the code review to ensure production readiness, specifically transaction atomicity, consistent soft-delete, and Result pattern compliance.

**Architecture:** Refactoring `BaseRepository` to support a "Unit of Work" or transaction-injection pattern. Enhancing the Prisma extension for comprehensive global filtering. Standardizing error handling across all repositories.

**Tech Stack:** TypeScript, Prisma 7, Drizzle ORM, neverthrow.

---

### Task 1: Transaction Support in BaseRepository

**Files:**

- Modify: `packages/database/src/base/base.repository.ts`
- Test: `packages/database/tests/integration/transaction-repository.test.ts`

- [ ] **Step 1: Write integration test for cross-repository transaction rollback**

```typescript
it('should rollback repository operations when transaction fails', async () => {
  const repo = new UserRepo(auditLogger);
  const result = await TransactionManager.run(async (tx) => {
    await repo.withTransaction(tx).create({ name: 'RollbackMe' });
    return err(new AppError('force.rollback'));
  });
  const user = await testDb.prisma.user.findFirst({ where: { name: 'RollbackMe' } });
  expect(user).toBeNull();
});
```

- [ ] **Step 2: Implement `withTransaction` and client injection in `BaseRepository`**

```typescript
export abstract class BaseRepository<T> {
  constructor(
    protected auditLogger: any,
    protected db: any = prisma,
  ) {}

  withTransaction(tx: any): this {
    const RepositoryClass = this.constructor as any;
    return new RepositoryClass(this.auditLogger, tx);
  }
  // Use this.db instead of this.model
}
```

- [ ] **Step 3: Run test to verify passes**
- [ ] **Step 4: Commit**

---

### Task 2: Unify Soft Delete in findUnique

**Files:**

- Modify: `packages/database/src/prisma/client.ts`
- Test: `packages/database/tests/integration/soft-delete.test.ts`

- [ ] **Step 1: Add failing test for findUnique soft delete**

```typescript
it('should return null when finding a deleted record via findUnique', async () => {
  const user = await prisma.user.create({ data: { name: 'Unique' } });
  await prisma.user.delete({ where: { id: user.id } });
  const found = await prisma.user.findUnique({ where: { id: user.id } });
  expect(found).toBeNull();
});
```

- [ ] **Step 2: Update Prisma extension to override findUnique**

- [ ] **Step 3: Run test to verify passes**
- [ ] **Step 4: Commit**

---

### Task 3: Standardize Result Pattern in Vector Repository

**Files:**

- Modify: `packages/database/src/base/vector.repository.ts`
- Test: `packages/database/tests/integration/vector-search.test.ts`

- [ ] **Step 1: Update DrizzleVectorRepository methods to return `Result<T, AppError>`**
- [ ] **Step 2: Update tests to expect Result objects**
- [ ] **Step 3: Run test to verify passes**
- [ ] **Step 4: Commit**

---

### Task 4: Complete Audit Trail (deletedBy)

**Files:**

- Modify: `packages/database/src/base/base.repository.ts`
- Modify: `packages/database/src/prisma/client.ts`

- [ ] **Step 1: Pass `deletedBy` in `BaseRepository.delete`**
- [ ] **Step 2: Update extension to set `deletedBy` during soft delete**
- [ ] **Step 3: Commit**

---

### Task 5: Dynamic Vector Dimensions

**Files:**

- Modify: `packages/database/src/drizzle/schema.ts`

- [ ] **Step 1: Move dimensions to a project-level constant or env var**
- [ ] **Step 2: Commit**
