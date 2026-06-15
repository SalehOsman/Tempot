# Implementation Plan: Data Integrity Hardening

**Branch**: `codex/055-data-integrity-hardening` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

## Summary

Correct four related persistence invariants: atomic national-ID-derived user
updates, non-overridable soft deletion, repository-only application data
access, and aggregate pagination counts. Deliver each invariant as an
independently tested and reviewed change while consolidating shared database
policy only where duplication is proven.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Prisma 7.x, neverthrow 8.2.0, existing BaseRepository and authorization context
**Storage**: PostgreSQL 16
**Testing**: Vitest 4.1.0, Testcontainers, boundary audit, query/mocking assertions
**Target Platform**: Node.js 22.12+
**Project Type**: TypeScript modular monorepo
**Performance Goals**: Paginated requests transfer only page rows plus aggregate count; no O(N) entity load for totals
**Constraints**: Repository-only business access, Result APIs, soft-delete enforcement, scoped commits, no unrelated repository rewrite
**Scale/Scope**: Shared database package, bot-server composition reads, user-management, template-management, bot-management

## Constitution Check

- **Rule VII**: Fix transaction, merge order, direct access, and count behavior at their source.
- **Rule IX**: Each invariant is a separate implementation/review concern.
- **Rules XIII-XV**: Preserve layer and module boundaries.
- **Rule XIV**: All business/application database access uses repositories.
- **Rule XXI**: Fallible repository operations return Result.
- **Rules XXVI-XXVII**: Authorization and soft-delete policy remain enforced.
- **Rule XXXIV**: Every correction begins with a failing test.
- **Rule LIV**: Shared database changes require blast-radius analysis.
- **Rule L**: Architecture, repository docs, SpecKit artifacts, roadmap, and changesets remain synchronized.

Initial gate result: PASS.

## Project Structure

```text
specs/055-data-integrity-hardening/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- data-access-invariants.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md

packages/database/src/
packages/database/prisma/
apps/bot-server/src/startup/
modules/user-management/
modules/template-management/
modules/bot-management/
scripts/ci/
```

**Structure Decision**: Shared invariants live in `@tempot/database`; domain
repositories own domain transactions and mappings; application composition
consumes explicit query repositories; CI statically enforces prohibited access.

## Delivery Slices

1. **Atomic identity transaction**: user-management only.
2. **Soft-delete invariant**: shared implementation plus affected repositories.
3. **Repository boundary**: explicit read/write repositories and static rule.
4. **Aggregate pagination**: user/template repository count methods.

Each slice has its own RED/GREEN/REFACTOR evidence and commit.

## TDD Strategy

- Failure injection for every transaction step.
- Adversarial `isDeleted` filters for each read method.
- Static fixture proving a prohibited Prisma import fails.
- Query-spy/integration tests proving aggregate count use.

## Verification Strategy

- Focused package/module tests after each slice.
- Database integration tests via Testcontainers.
- `pnpm boundary:audit`
- `pnpm lint`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm spec:validate`

## Post-Design Constitution Check

The plan restores repository, soft-delete, Result, TDD, and blast-radius
requirements without introducing a new persistence architecture.

Post-design gate result: PASS.

## Complexity Tracking

No constitution exception is required.
