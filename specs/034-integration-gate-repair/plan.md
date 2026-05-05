# Implementation Plan: Integration Gate Repair

**Branch**: `codex/034-integration-gate-repair`
**Spec**: `specs/034-integration-gate-repair/spec.md`

## Summary

Repair the repository-wide integration gate by removing global `pnpm` assumptions from integration setup and centralizing database schema bootstrap in the database test harness. The implementation must fix the source of the gate failures, not mask them with local shell shims or per-test workarounds.

## Technical Context

- Runtime: Node.js 22.12+
- Package manager: pnpm through Corepack
- Test runner: Vitest 4.1.0
- Database: PostgreSQL 16 with pgvector through Testcontainers or external CI database
- ORM/schema tools: Prisma 7.x and Drizzle for pgvector
- Current failing command: `corepack pnpm test:integration`

## Constitution Check

- TDD is mandatory: first capture failing integration behavior, then implement the shared setup repair.
- Fix at source: use shared TestDB/test infrastructure instead of adding a global shim dependency.
- Clean diff: keep edits scoped to Spec #034 artifacts and integration test infrastructure.
- No prohibited TypeScript escapes: no `any`, suppression comments, or broad casts unless an existing local pattern already requires a typed compatibility cast.
- Documentation parity: update SpecKit artifacts and validation evidence before finish.

## Project Structure

```text
packages/database/src/testing/database.helper.ts
packages/database/tests/integration/audit-log-schema.test.ts
packages/database/tests/integration/soft-delete.test.ts
packages/database/tests/integration/transaction-repository.test.ts
packages/database/tests/integration/vector-search.test.ts
packages/logger/tests/integration/audit-logger.test.ts
packages/settings/tests/integration/settings.integration.test.ts
specs/034-integration-gate-repair/
```

## Implementation Approach

1. Reproduce the failing `test:integration` behavior in the isolated worktree.
2. Add or update integration tests/helper behavior so the RED failure is specific to schema/tool setup.
3. Introduce a shared database test bootstrap API in `TestDB` that can prepare Prisma schema and vector schema without assuming global `pnpm`.
4. Replace duplicated `execSync('pnpm ...')` setup in affected integration tests with the shared helper.
5. Run the integration gate, then surrounding gates.

## Risk and Mitigation

- **Risk**: Running schema push concurrently across suites can race.
  **Mitigation**: Make bootstrap idempotent and scoped per TestDB database connection.
- **Risk**: Drizzle and Prisma setup paths diverge.
  **Mitigation**: expose explicit helper methods for Prisma schema and vector schema setup.
- **Risk**: CI external database mode differs from Testcontainers local mode.
  **Mitigation**: validate helper uses the current `DATABASE_URL` after `TestDB.start()`.

## No ADR Required

No new architecture pattern or external dependency is expected. This is test infrastructure repair within the existing database package.
