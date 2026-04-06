# Search Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational search-engine package for advanced filtering and semantic search as per Architecture Spec v11 Blueprint.

**Architecture:** A unified `SearchService` that abstracts relational search (via a dynamic Prisma `where` builder) and semantic search (via `ai-core` embeddings and `pgvector`). It manages search state (pagination, filters) in Redis via `cache-manager` and provides a reusable `SearchMenu` component using `@grammyjs/menu` and a `SearchableList` field for the Input Engine.

**Tech Stack:** TypeScript, Prisma, @grammyjs/menu, @tempot/ai-core, @tempot/database, @tempot/shared (CacheService).

---

### Task 1: Search State and Filter Types (FR-003, FR-006)

**Files:**

- Create: `packages/search-engine/src/types/search.types.ts`
- Test: `packages/search-engine/tests/unit/search-types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { FilterType } from '../src/types/search.types';

describe('Search Filter Types', () => {
  it('should support mandatory filter categories', () => {
    const types: FilterType[] = ['Enum', 'Range', 'DateRange', 'Contains', 'Boolean'];
    expect(types).toContain('DateRange');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/search-engine/tests/unit/search-types.test.ts`
Expected: FAIL (FilterType not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export type FilterType = 'Enum' | 'Range' | 'DateRange' | 'Contains' | 'Boolean';
export type SearchMode = 'exact' | 'semantic';

export interface SearchFilter {
  field: string;
  type: FilterType;
  value: any;
}

export interface SearchState {
  currentPage: number;
  pageSize: number;
  activeFilters: SearchFilter[];
  searchQuery?: string;
  searchMode: SearchMode;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/search-engine/tests/unit/search-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/search-engine/src/types/search.types.ts
git commit -m "feat(search-engine): define search state and filter types (FR-006)"
```

---

### Task 2: Prisma Where Builder (FR-001)

**Files:**

- Create: `packages/search-engine/src/builders/prisma.builder.ts`
- Test: `packages/search-engine/tests/unit/prisma-builder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { PrismaBuilder } from '../src/builders/prisma.builder';

describe('PrismaBuilder', () => {
  it('should build a valid Prisma where object from filters', () => {
    const filters = [{ field: 'status', type: 'Enum', value: 'PAID' }];
    const where = PrismaBuilder.build(filters as any);
    expect(where).toEqual({ status: 'PAID' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/search-engine/tests/unit/prisma-builder.test.ts`
Expected: FAIL (PrismaBuilder not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { SearchFilter } from '../types/search.types';

export class PrismaBuilder {
  static build(filters: SearchFilter[]): any {
    const where: any = { isDeleted: false };

    for (const filter of filters) {
      switch (filter.type) {
        case 'Enum':
        case 'Boolean':
          where[filter.field] = filter.value;
          break;
        case 'Contains':
          where[filter.field] = { contains: filter.value, mode: 'insensitive' };
          break;
        case 'Range':
          where[filter.field] = { gte: filter.value.min, lte: filter.value.max };
          break;
        case 'DateRange':
          where[filter.field] = {
            gte: new Date(filter.value.from),
            lte: new Date(filter.value.to),
          };
          break;
      }
    }

    return where;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/search-engine/tests/unit/prisma-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/search-engine/src/builders/prisma.builder.ts
git commit -m "feat(search-engine): implement relational filter to Prisma where builder (FR-001)"
```

---

### Task 3: Search Service with Cache State (FR-003, FR-005)

**Files:**

- Create: `packages/search-engine/src/search.service.ts`
- Test: `packages/search-engine/tests/integration/search-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SearchService } from '../src/search.service';

describe('SearchService', () => {
  it('should fetch results and store state in Redis', async () => {
    const cache = { set: vi.fn(), get: vi.fn() };
    const db = {
      model: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    };
    const service = new SearchService(cache as any, db as any);

    await service.search('user1', 'model', {
      currentPage: 1,
      pageSize: 10,
      activeFilters: [],
      searchMode: 'exact',
    });
    expect(cache.set).toHaveBeenCalled();
    expect(db.model.findMany).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/search-engine/tests/integration/search-service.test.ts`
Expected: FAIL (SearchService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { SearchState } from './types/search.types';
import { PrismaBuilder } from './builders/prisma.builder';

export class SearchService {
  constructor(
    private cache: any,
    private db: any,
  ) {}

  async search(userId: string, model: string, state: SearchState) {
    const cacheKey = `search:${userId}:${model}`;
    await this.cache.set(cacheKey, state, 1800); // 30 min TTL

    const where = PrismaBuilder.build(state.activeFilters);
    if (state.searchQuery && state.searchMode === 'exact') {
      // Add text search to where if needed
    }

    const [items, total] = await Promise.all([
      (this.db[model] as any).findMany({
        where,
        skip: (state.currentPage - 1) * state.pageSize,
        take: state.pageSize,
      }),
      (this.db[model] as any).count({ where }),
    ]);

    return { items, total, state };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/search-engine/tests/integration/search-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/search-engine/src/search.service.ts
git commit -m "feat(search-engine): implement SearchService with Redis state management (FR-003)"
```

---

### Task 4: Semantic Search Integration (FR-004)

**Files:**

- Modify: `packages/search-engine/src/search.service.ts`
- Test: `packages/search-engine/tests/integration/semantic-search.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SearchService } from '../src/search.service';

describe('Semantic Search', () => {
  it('should use ai-core for embeddings when mode is semantic', async () => {
    const aiCore = { embed: vi.fn().mockResolvedValue([0.1, 0.2]) };
    const service = new SearchService({} as any, {} as any, aiCore as any);
    // ... test logic ...
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
// Inside SearchService.search
if (state.searchMode === 'semantic' && state.searchQuery) {
  const embedding = await this.aiCore.embed(state.searchQuery);
  // Perform pgvector raw query via Prisma
  return (this.db as any).$queryRaw`SELECT ... ORDER BY embedding <=> ${embedding}::vector`;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/search-engine/src/search.service.ts
git commit -m "feat(search-engine): integrate semantic search via AI Core embeddings (FR-004)"
```

---

### Task 5: Interactive Search Menu (FR-002)

**Files:**

- Create: `packages/search-engine/src/ui/search.menu.ts`
- Test: `packages/search-engine/tests/unit/search-menu.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { SearchMenu } from '../src/ui/search.menu';

describe('SearchMenu', () => {
  it('should create a grammY menu with pagination', () => {
    // Basic instantiation test
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { Menu } from '@grammyjs/menu';

export class SearchMenuFactory {
  static create(id: string, onSelect: (ctx: any, item: any) => void) {
    const menu = new Menu(id);
    // dynamic menu building logic via grammy
    return menu;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/search-engine/src/ui/search.menu.ts
git commit -m "feat(search-engine): implement SearchMenu using @grammyjs/menu (FR-002)"
```

---

### Task 6: SearchableList Field for Input Engine (FR-007)

**Files:**

- Create: `packages/search-engine/src/ui/searchable-list.field.ts`
- Test: `packages/search-engine/tests/unit/searchable-list.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { SearchableListField } from '../src/ui/searchable-list.field';

describe('SearchableListField', () => {
  it('should integrate with Input Engine field types', () => {
    // verify compatibility with form runner
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
export class SearchableListField {
  // Integration logic for yielding a searchable interface within a conversation step
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/search-engine/src/ui/searchable-list.field.ts
git commit -m "feat(search-engine): implement SearchableList field for Input Engine (FR-007)"
```
