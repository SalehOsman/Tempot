# @tempot/search-engine

> Dynamic Prisma `where` builder + `@grammyjs/menu` display layer for paginated, searchable lists.

## Purpose

- Builds Prisma `where` conditions from user-provided filters (dates, enums, text, booleans)
- `@grammyjs/menu` renders the list UI with navigation, search, and filter buttons
- Semantic search via `@tempot/ai-core` when `hasAI=true`
- Search state stored in cache-manager (30-minute TTL per user)
- Modules provide a `dataProvider(page, query, filters)` function — search-engine handles the rest

Disabled by default. Enable per-module with `features.hasSearch: true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package              | Purpose                               |
| -------------------- | ------------------------------------- |
| `@grammyjs/menu` 1.x | List display and navigation — ADR-025 |
| `@tempot/database`   | Prisma `where` query construction     |
| `@tempot/shared`     | cache-manager for search state        |
| `@tempot/ai-core`    | Semantic search (optional)            |
| `@tempot/ux-helpers` | Status messages                       |
| `@tempot/i18n-core`  | Localised UI text                     |

## API

```typescript
import { SearchEngine } from '@tempot/search-engine';

// In a module handler
const dataProvider = async (page: number, query: string, filters: FilterRule[]) => {
  const where = SearchEngine.buildWhere(filters, query, ['name', 'description']);
  const [items, total] = await Promise.all([
    invoiceRepo.findMany({ where, skip: page * 10, take: 10 }),
    invoiceRepo.count({ where }),
  ]);
  return { items, total };
};

await SearchEngine.render(
  ctx,
  {
    titleKey: 'invoices.list.title',
    pageSize: 10,
    searchMode: 'exact', // or 'semantic' when hasAI=true
    filters: [
      { field: 'status', type: 'enum', options: ['PENDING', 'PAID', 'CANCELLED'] },
      { field: 'createdAt', type: 'date_range' },
      { field: 'amount', type: 'number_range' },
    ],
  },
  dataProvider,
);
```

## ADRs

- ADR-015 — Prisma where builder in search engine
- ADR-025 — @grammyjs/menu for display layer

## Status

⏳ **Not yet implemented** — Phase 4
