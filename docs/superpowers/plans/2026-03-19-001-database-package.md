# Database Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational database package with Prisma 7+, Drizzle (pgvector), and a standardized Repository Pattern.

**Architecture:** Clean Architecture with a unified `BaseRepository`. Prisma handles relational data and soft deletes via extensions, while Drizzle handles type-safe vector operations. A centralized `TransactionManager` ensures atomic operations across multiple repositories. A schema orchestration script merges module-specific schemas into the central Prisma definition. Integration testing uses a standardized `Testcontainers` utility for PostgreSQL + pgvector.

**Tech Stack:** TypeScript, Prisma 7, Drizzle ORM, pgvector, neverthrow, AsyncLocalStorage, Testcontainers, vitest.

---

### Task 1: Base Entity Definition

**Files:**
- Create: `packages/database/src/base/base.entity.ts`
- Test: `packages/database/tests/unit/base-entity.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';

describe('BaseEntity', () => {
  it('should have all mandatory audit fields defined', () => {
    const entity: any = {}; // Mock
    expect(entity).toHaveProperty('id');
    expect(entity).toHaveProperty('isDeleted');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/database/tests/unit/base-entity.test.ts`
Expected: FAIL (fields missing)

- [ ] **Step 3: Write minimal implementation**

```typescript
export abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
  updatedBy?: string;
  isDeleted!: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/unit/base-entity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/base/base.entity.ts packages/database/tests/unit/base-entity.test.ts
git commit -m "feat(database): add BaseEntity with mandatory audit fields"
```

---

### Task 2: Integration Test Infrastructure (Testcontainers)

**Files:**
- Create: `packages/database/tests/utils/test-db.ts`

- [ ] **Step 1: Implement the TestDB utility**

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDB {
  private container!: StartedPostgreSqlContainer;
  public prisma!: PrismaClient;

  async start() {
    this.container = await new PostgreSqlContainer('ankane/pgvector:latest').start();
    const url = this.container.getConnectionString();
    process.env.DATABASE_URL = url;
    
    // Run migrations
    execSync('pnpm prisma migrate deploy', { env: process.env });
    
    this.prisma = new PrismaClient();
  }

  async stop() {
    await this.prisma.$disconnect();
    await this.container.stop();
  }
}
```

- [ ] **Step 2: Commit infrastructure setup**

```bash
git add packages/database/tests/utils/test-db.ts
git commit -m "test(database): setup Testcontainers utility for integration tests"
```

---

### Task 3: Prisma Soft Delete Extension

**Files:**
- Create: `packages/database/src/prisma/client.ts`
- Test: `packages/database/tests/integration/soft-delete.test.ts`

- [ ] **Step 1: Write the failing test using TestDB**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';
import { prisma } from '../src/prisma/client';

describe('Soft Delete Extension', () => {
  const testDb = new TestDB();
  beforeAll(async () => await testDb.start());
  afterAll(async () => await testDb.stop());

  it('should set isDeleted to true instead of removing the record', async () => {
    const user = await prisma.user.create({ data: { name: 'Test' } });
    await prisma.user.delete({ where: { id: user.id } });
    const deletedUser = await testDb.prisma.user.findUnique({ where: { id: user.id } });
    expect(deletedUser?.isDeleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/database/tests/integration/soft-delete.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async delete<T, A>(this: T, args: Prisma.Args<T, 'delete'>) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          ...args,
          data: { isDeleted: true, deletedAt: new Date() },
        });
      },
    },
  },
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/integration/soft-delete.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/prisma/client.ts packages/database/tests/integration/soft-delete.test.ts
git commit -m "feat(database): implement global soft delete via Prisma extension"
```

---

### Task 4: Base Repository with Result Pattern & AuditLog Triggers

**Files:**
- Create: `packages/database/src/base/base.repository.ts`
- Test: `packages/database/tests/unit/base-repository.test.ts`

- [ ] **Step 1: Write the failing test for audit logging**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../src/base/base.repository';

describe('BaseRepository Audit', () => {
  it('should trigger AuditLogger on create', async () => {
    const auditLogger = { log: vi.fn() };
    const repo = new TestRepository(auditLogger as any);
    await repo.create({ name: 'test' });
    expect(auditLogger.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/database/tests/unit/base-repository.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation with Audit triggers**

```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { sessionContext } from '@tempot/session-manager';

export abstract class BaseRepository<T> {
  protected abstract model: any;
  protected abstract moduleName: string;
  protected abstract entityName: string;

  constructor(protected auditLogger: any) {}

  async findById(id: string): Promise<Result<T, AppError>> {
    try {
      const item = await this.model.findUnique({ where: { id, isDeleted: false } });
      if (!item) return err(new AppError('database.not_found'));
      return ok(item);
    } catch (e) {
      return err(new AppError('database.unexpected', e));
    }
  }

  protected getContext() {
    const store = sessionContext.getStore();
    return {
      userId: store?.userId,
      userRole: store?.userRole
    };
  }

  async create(data: any): Promise<Result<T, AppError>> {
    const { userId, userRole } = this.getContext();
    try {
      const item = await this.model.create({
        data: { ...data, createdBy: userId }
      });
      
      await this.auditLogger.log({
        userId,
        userRole,
        action: `${this.moduleName}.${this.entityName}.create`,
        module: this.moduleName,
        targetId: (item as any).id,
        after: item,
        status: 'SUCCESS'
      });

      return ok(item);
    } catch (e) {
      return err(new AppError('database.create_failed', e));
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/unit/base-repository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/base/base.repository.ts
git commit -m "feat(database): implement BaseRepository with AuditLog triggers (Rule LVII)"
```

---

### Task 5: Drizzle ORM + pgvector Setup

**Files:**
- Create: `packages/database/drizzle.config.ts`
- Create: `packages/database/src/drizzle/schema.ts`
- Create: `packages/database/src/base/vector.repository.ts`
- Test: `packages/database/tests/integration/vector-search.test.ts`

- [ ] **Step 1: Define Drizzle schema with pgvector**

```typescript
import { pgTable, uuid, vector, text, jsonb } from 'drizzle-orm/pg-core';

export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(),
  vector: vector('vector', { dimensions: 1536 }).notNull(),
  metadata: jsonb('metadata'),
});
```

- [ ] **Step 2: Write the failing test for similarity search using TestDB**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';
import { DrizzleVectorRepository } from '../src/base/vector.repository';

describe('Vector Search', () => {
  const testDb = new TestDB();
  beforeAll(async () => await testDb.start());
  afterAll(async () => await testDb.stop());

  it('should return semantically similar results', async () => {
    // ... test logic ...
  });
});
```

- [ ] **Step 3: Implement DrizzleVectorRepository**

```typescript
import { cosineDistance, desc } from 'drizzle-orm';
import { embeddings } from './schema';

export abstract class DrizzleVectorRepository {
  constructor(protected db: any) {}

  async search(vec: number[], limit: number = 5) {
    return this.db.select()
      .from(embeddings)
      .orderBy(cosineDistance(embeddings.vector, vec))
      .limit(limit);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/integration/vector-search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/drizzle.config.ts packages/database/src/drizzle/schema.ts packages/database/src/base/vector.repository.ts
git commit -m "feat(database): setup Drizzle ORM with pgvector and base vector repository"
```

---

### Task 6: Transaction Manager (FR-007)

**Files:**
- Create: `packages/database/src/manager/transaction.manager.ts`
- Test: `packages/database/tests/unit/transaction-manager.test.ts`

- [ ] **Step 1: Write the failing test for rollback**

```typescript
import { describe, it, expect } from 'vitest';
import { TransactionManager } from '../src/manager/transaction.manager';

describe('TransactionManager', () => {
  it('should rollback changes when a task fails', async () => {
    // Mock prisma.$transaction
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/database/tests/unit/transaction-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma } from '../prisma/client';

export class TransactionManager {
  static async run<T>(
    fn: (tx: any) => Promise<Result<T, AppError>>
  ): Promise<Result<T, AppError>> {
    try {
      return await prisma.$transaction(async (tx) => {
        const result = await fn(tx);
        if (result.isErr()) throw result.error; // Trigger rollback
        return result;
      });
    } catch (e) {
      if (e instanceof AppError) return err(e);
      return err(new AppError('database.transaction_failed', e));
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/unit/transaction-manager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/manager/transaction.manager.ts
git commit -m "feat(database): implement TransactionManager with Result pattern and rollback support"
```

---

### Task 7: AuditLog Schema Definition

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Test: `packages/database/tests/integration/audit-log-schema.test.ts`

- [ ] **Step 1: Define AuditLog model in Prisma**

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  userRole  String?
  action    String
  module    String
  targetId  String?
  before    Json?
  after     Json?
  status    String   @default("SUCCESS")
  timestamp DateTime @default(now())

  @@index([module, action])
  @@index([userId])
}
```

- [ ] **Step 2: Write failing test for schema validation**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';

describe('AuditLog Schema', () => {
  const testDb = new TestDB();
  beforeAll(async () => await testDb.start());
  afterAll(async () => await testDb.stop());

  it('should allow creating a valid audit log entry', async () => {
    const entry = await testDb.prisma.auditLog.create({
      data: {
        action: 'user.profile.update',
        module: 'users',
        status: 'SUCCESS'
      }
    });
    expect(entry.id).toBeDefined();
  });
});
```

- [ ] **Step 3: Run Prisma migration**

Run: `pnpm prisma migrate dev --name add_audit_log`
Expected: SUCCESS

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/database/tests/integration/audit-log-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(database): define AuditLog schema in Prisma (Rule LVII)"
```

---

### Task 8: Modular Schema Orchestration (FR-006)

**Files:**
- Create: `packages/database/scripts/merge-schemas.ts`
- Create: `packages/database/prisma/base.prisma`
- Modify: `package.json`

- [ ] **Step 1: Create the schema merging script**

```typescript
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

async function mergeSchemas() {
  const baseSchema = await fs.readFile('packages/database/prisma/base.prisma', 'utf-8');
  const moduleSchemas = await glob('modules/*/database/*.prisma');
  
  let finalSchema = baseSchema;
  for (const schemaPath of moduleSchemas) {
    const content = await fs.readFile(schemaPath, 'utf-8');
    finalSchema += `\n// From ${schemaPath}\n${content}`;
  }
  
  await fs.writeFile('packages/database/prisma/schema.prisma', finalSchema);
  console.log('Schemas merged successfully.');
}

mergeSchemas();
```

- [ ] **Step 2: Run test to verify merging**

Run: `ts-node packages/database/scripts/merge-schemas.ts`
Expected: SUCCESS (schema.prisma created/updated)

- [ ] **Step 3: Update package.json scripts**

```json
"scripts": {
  "db:merge": "ts-node packages/database/scripts/merge-schemas.ts",
  "db:generate": "pnpm db:merge && prisma generate"
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/database/scripts/merge-schemas.ts packages/database/prisma/base.prisma
git commit -m "feat(database): implement modular schema orchestration (FR-006)"
```
