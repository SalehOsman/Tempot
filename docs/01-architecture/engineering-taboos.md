# Forbidden Engineering Practices & Architectural Taboos

## 1. Overview
To ensure long-term stability, security, and enterprise robustness, the following 10 engineering anti-patterns and implementation shortcuts are **strictly prohibited** across all layers of the Tembot-v2 Platform.

---

## 2. The 10 Engineering Taboos

### 🚫 Taboo 1: Business Logic in Controllers or Handlers (Controller Purity)
- **Violation:** Executing database queries (`db.select(...)`), calculating balances, or applying business rules directly inside Hono route handlers or grammY bot listeners.
- **Mandatory Pattern:** Controllers must strictly parse contracts, validate DTOs with Zod, and delegate to application ports or slice actions.

### 🚫 Taboo 2: Destructive Database Mutations (Zero Hard Deletes)
- **Violation:** Executing `DELETE FROM ...` SQL statements on production or domain tables.
- **Mandatory Pattern:** All deletions must be logical soft deletes by populating a `deleted_at` timestamp. Historical rows are preserved for audit and financial reconciliation.

### 🚫 Taboo 3: Floating-Point Financial Representation
- **Violation:** Using JavaScript binary floating-point numbers (`number`) or SQL `real` / `float` for monetary amounts, prices, or ledger balances.
- **Mandatory Pattern:** Store monetary values as `NUMERIC(24, 8)` in PostgreSQL and calculate balances exclusively using `decimal.js@10.6.0`.

### 🚫 Taboo 4: Unpinned System Time in Domain Logic
- **Violation:** Calling `new Date()` or `Date.now()` directly inside domain calculations or temporal assertions.
- **Mandatory Pattern:** Always inject a `ClockProvider` or `SystemClock`. In test suites, anchor time to `PINNED_BASE_TIME`.

### 🚫 Taboo 5: Swallowing Errors & Fabricating Nulls
- **Violation:** Empty `catch {}` blocks that silence exceptions or return fabricated fallback nulls/booleans.
- **Mandatory Pattern:** Return explicit `Result<T, DomainError>` via `neverthrow`. Unhandled infrastructure errors must fail fast with structured RFC 7807 problem details.

### 🚫 Taboo 6: Deep Cross-Module Imports
- **Violation:** Importing private files from another module (e.g. `import ... from 'modules/kernel/access-control/src/private-repo'`).
- **Mandatory Pattern:** Modules communicate exclusively through the public barrel (`index.ts`) and declared public contracts.

### 🚫 Taboo 7: Direct Cross-Module Database Queries
- **Violation:** Querying or joining database tables owned by another module via raw SQL or foreign schema imports.
- **Mandatory Pattern:** Invoke the owning module's public query port.

### 🚫 Taboo 8: Unbounded Synchronous Handlers
- **Violation:** Running long-running processes (e.g., mass broadcasts, PDF generation, large file uploads) synchronously inside HTTP or Telegram webhook requests.
- **Mandatory Pattern:** Enqueue background jobs to BullMQ and return immediate acknowledgement.

### 🚫 Taboo 9: Mixing Telegram Formatting Modes
- **Violation:** Combining raw Markdown strings with HTML tags or mixing rich blocks with unformatted text.
- **Mandatory Pattern:** Use template builders from `@tembot/core-components` (`buildRichPage`, `buildRichTable`) and validate limits with `assertRichMessage`.

### 🚫 Taboo 10: Sham & Cosmetic Test Assertions
- **Violation:** Writing tautological tests like `expect(true).toBe(true)` or mocking pure business logic calculations.
- **Mandatory Pattern:** Assert authentic state transitions, error outcomes, and database mutations against genuine ports.
