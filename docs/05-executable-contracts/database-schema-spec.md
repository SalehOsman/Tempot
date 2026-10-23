# Relational Database Schema & Persistence Invariants

## 1. Overview & Stack
- **Database Engine:** PostgreSQL 16
- **ORM & Migrations:** `drizzle-orm@0.45.3` + `drizzle-kit@0.31.11`
- **Driver:** `pg@8.23.1`

All persistent data models are declared as strongly-typed TypeScript schemas under each owning module's `db/` directory.

---

## 2. Core Relational Invariants

### 2.1 Zero Hard-Deletes Invariant
Destructive `DELETE FROM ...` SQL statements are strictly prohibited across all domain entities.
- Every mutable table defines a nullable `deleted_at` timestamp:
  ```typescript
  import { timestamp } from 'drizzle-orm/pg-core';

  export const softDeleteColumns = {
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  };
  ```
- Application queries filter active records using `isNull(table.deletedAt)`.

### 2.2 Arbitrary-Precision Financial Invariant
- IEEE-754 binary floating-point types (`real`, `double precision`, `float`) are prohibited for financial calculations.
- All monetary values, transaction balances, and prices are stored using `NUMERIC(24, 8)`:
  ```typescript
  import { numeric } from 'drizzle-orm/pg-core';

  export const monetaryAmount = numeric('amount', { precision: 24, scale: 8 }).notNull();
  ```
- Runtime calculations on these values mandate `decimal.js@10.6.0`.

### 2.3 Double-Entry Accounting Invariant
Any schema handling financial balances or ledger transactions enforces:
$$\sum \text{Debits} - \sum \text{Credits} = 0$$
Postings are immutable, append-only, and audited.

### 2.4 Multi-Tenancy Readiness (`tenant_id`)
To enable SaaS multi-tenancy without database redesign:
```typescript
import { uuid } from 'drizzle-orm/pg-core';

export const multiTenancyColumns = {
  tenantId: uuid('tenant_id'), // Nullable for single-tenant, populated in multi-tenant mode
};
```

### 2.5 Timezone-Aware Auditing
- Plain timestamps (`timestamp without time zone`) are forbidden.
- All temporal columns must use `timestamp with time zone` (`timestamptz`).
