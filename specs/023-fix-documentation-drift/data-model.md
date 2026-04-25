# Fix Documentation Drift — Data Model

**Feature:** 023-fix-documentation-drift
**Source:** spec.md + plan.md
**Generated:** 2026-04-26

---

## Overview

This is a **documentation-only fix** with no data model changes. No database schemas, no API contracts, no data structures are modified or added.

---

## No Database Changes

**Reason**: This feature fixes documentation drift only. No database operations are involved.

**Verification**:
- No Prisma schema changes
- No Drizzle schema changes
- No migration files
- No database queries

---

## No API Contract Changes

**Reason**: This feature fixes documentation drift only. No API changes are involved.

**Verification**:
- No new interfaces
- No new types
- No new functions
- No function signature changes

---

## No Data Structure Changes

**Reason**: This feature fixes documentation drift only. No data structures are modified.

**Verification**:
- No new classes
- No new enums
- No new constants
- No data transformations

---

## Documentation Data Model

### README.md Tech Stack Table

**Structure**:
```markdown
| Category       | Technology                            | Version       | Purpose                                             |
| -------------- | ------------------------------------- | ------------- | --------------------------------------------------- |
| Runtime        | Node.js 20+                           | 20+           | ESM, native TypeScript support                      |
| Language       | TypeScript 5.9 Strict                 | 5.9.3         | Full type safety, zero `any`                        |
| Bot Engine     | grammY 1.x                            | ^1.41.1       | Modern, TypeScript-first Telegram framework         |
| Web Server     | Hono 4.x                              | 4.x           | Ultrafast, Edge-compatible, 15+ built-in middleware |
| Database       | PostgreSQL 16 + pgvector              | 16            | Relational data + vector search                     |
| Primary ORM    | Prisma 7.x                            | 7.x           | Type-safe queries, auto migrations                  |
| Vector ORM     | Drizzle 0.45.x                        | 0.45.x        | Native pgvector operations                          |
| Cache          | cache-manager 6.x                     | 6.x           | Multi-tier: Memory → Redis → DB                     |
| Queue          | BullMQ 5.x                            | 5.x           | Reliable job processing                             |
| AI             | Vercel AI SDK 6.x                     | 6.x           | Provider-agnostic AI abstraction                    |
| Auth           | CASL 6.x                              | 6.x           | RBAC + ABAC with Prisma adapter                     |
| Error Handling | neverthrow 8.2.0                      | 8.2.0         | Result pattern — no thrown exceptions               |
| Validation     | Zod                                   | ^4.3.6        | Runtime schema validation                           |
| i18n           | i18next 25.x                          | 25.x          | Multi-language with JSON backends                   |
| Logging        | Pino 9.x                              | 9.x           | Fastest JSON logger for Node.js                     |
| Testing        | Vitest 4.1.0 + Testcontainers           | 4.1.0 / 8.0.1 | Unit + containerized integration tests              |
| Security       | sanitize-html + @grammyjs/ratelimiter | -             | XSS protection + rate limiting                      |
| Frontend       | Next.js + Tailwind CSS                | -             | Dashboard + Mini App                                |
| Versioning     | Changesets                            | -             | Automated semantic releases                         |
```

**Changes**:
- Line 171: "Vercel AI SDK 4.x" → "Vercel AI SDK 6.x"
- Line 173: "neverthrow 8.x" → "neverthrow 8.2.0"
- Line 177: "Vitest 4.x" → "Vitest 4.1.0"

### README.md Services Table

**Structure**:
```markdown
| Package                   | Description                                              | Status   |
| ------------------------- | -------------------------------------------------------- | -------- |
| `@tempot/shared`          | Error types, Result pattern, queue factory, cache wrapper | Stable   |
| `@tempot/logger`          | Structured JSON logging + audit trail via Pino            | Stable   |
| `@tempot/database`        | PostgreSQL schema, migrations, repository base classes    | Stable   |
| `@tempot/event-bus`       | Local + durable event system with BullMQ                  | Stable   |
| `@tempot/auth-core`       | RBAC + ABAC authorization via CASL                        | Stable   |
| `@tempot/session-manager` | Dual Redis + PostgreSQL session management                | Stable   |
| `@tempot/i18n-core`       | Multi-language support via i18next                       | Stable   |
| `@tempot/regional-engine` | Timezone, currency, geo data with dayjs                  | Stable   |
| `@tempot/storage-engine`  | Google Drive + S3 + Telegram + Local storage abstraction | Stable   |
| `@tempot/ux-helpers`      | Message composer, keyboards, pagination, feedback        | Stable   |
| `@tempot/ai-core`         | AI provider abstraction via Vercel AI SDK                | Stable   |
| `@tempot/module-registry` | Module auto-discovery and validation                     | Stable   |
| `@tempot/cms-engine`      | Dynamic translation management                           | Planned  |
| `@tempot/notifier`        | Multi-channel notifications via BullMQ                   | Planned  |
| `@tempot/document-engine` | PDF, Excel, Word generation                              | Planned  |
| `@tempot/input-engine`    | Dynamic form generation with Zod validation              | Stable   |
| `@tempot/search-engine`   | Full-text + semantic search with pgvector                | Planned  |
| `@tempot/import-engine`   | CSV, Excel import — event-driven processing              | Planned  |
```

**Changes**:
- Line 105: `@tempot/ux-helpers` "Building" → "Stable"
- Line 106: `@tempot/ai-core` "Planned" → "Stable"
- Line 113: `@tempot/module-registry` "Planned" → "Stable"

### README.md Applications Table

**Structure**:
```markdown
| App          | Description                    | Status  |
| ------------ | ------------------------------ | ------- |
| `bot-server` | grammY bot + Hono API server   | Stable  |
| `dashboard`  | Next.js admin panel            | Planned |
| `mini-app`   | Telegram Mini App frontend     | Planned |
| `docs`       | Engineering documentation site | Stable  |
```

**Changes**:
- Line 119: `bot-server` "Planned" → "Stable"
- Line 122: `docs` "Planned" → "Stable"

---

## SpecKit Artifacts Data Model

### Test Module Spec Artifacts

**Directory**: `f:\Tempot\specs/022-test-module/`

**Required Files**:
- `spec.md` (exists)
- `plan.md` (to be created)
- `tasks.md` (to be created)
- `data-model.md` (to be created)
- `research.md` (to be created)

**Content Requirements**:
- All artifacts must document temporary nature
- All artifacts must reference ROADMAP.md removal plan
- Follow SpecKit artifact structure

---

## apps/docs/README.md Data Model

**Structure**:
```markdown
# @tempot/docs

> Engineering documentation site powered by Astro + Starlight

## Purpose

- Developer documentation for all Tempot packages
- API reference via TypeDoc
- Architecture Decision Records (ADRs)
- Developer guides and workflows

## Phase

Phase 2 — Documentation System (spec #021)

## Dependencies

| Package                | Purpose                           |
| ---------------------- | --------------------------------- |
| Astro                  | Static site generator             |
| Starlight              | Documentation theme              |
| starlight-typedoc      | TypeDoc integration               |
| @tempot/shared         | Result pattern, AppError          |

## Scripts

```bash
pnpm --filter @tempot/docs dev        # Start dev server
pnpm --filter @tempot/docs build      # Build for production
pnpm --filter @tempot/docs preview    # Preview production build
```

## Status

✅ **Implemented** — Phase 2
```

---

## Verification Data Model

### Spec Validation Output

**Command**: `pnpm spec:validate`

**Expected Result**: Zero CRITICAL issues

**Success Criteria**:
- No FILE_REFERENCES errors
- No MISSING_ARTIFACTS errors
- No VERSION_MISMATCH errors
- Zero CRITICAL issues overall

### Test Validation Output

**Command**: `pnpm test`

**Expected Result**: All tests pass

**Success Criteria**:
- All unit tests pass
- All integration tests pass
- No test failures
- No test timeouts

### Lint Validation Output

**Command**: `pnpm lint`

**Expected Result**: No lint errors

**Success Criteria**:
- No ESLint errors
- No Prettier errors
- No style violations

### TypeScript Validation Output

**Command**: `pnpm typecheck`

**Expected Result**: No TypeScript errors

**Success Criteria**:
- No type errors
- No compilation errors
- No @ts-expect-error in test files

---

## Summary

This feature involves **no data model changes**. All changes are to documentation files and spec artifacts:

1. README.md (tech stack and status tables)
2. apps/docs/README.md (new file)
3. specs/022-test-module/ (4 new artifact files)
4. CHANGELOG.md (new entry)
5. ROADMAP.md (verification, potential update)

No database schemas, API contracts, or data structures are modified.
