# Research: Integration Gate Repair

## Decision: Fix command invocation at the test infrastructure boundary

- **Decision**: Avoid `execSync('pnpm ...')` in integration tests. Prefer shared helper methods that invoke workspace-local tools through Node APIs or `process.execPath` with package binaries.
- **Rationale**: The gate is executed through Corepack, and this Windows session does not provide a global `pnpm` binary. Tests should not depend on a shell command that is not part of the repository contract.
- **Alternatives rejected**:
  - Add a permanent local shim committed to the repository: this hides the test assumption instead of fixing it.
  - Patch every test with `corepack pnpm`: this still duplicates shell orchestration and keeps schema setup fragmented.

## Decision: Centralize Prisma schema bootstrap in TestDB

- **Decision**: Add a reusable TestDB-level path for preparing Prisma schema after `start()`.
- **Rationale**: Multiple integration tests repeat the same Prisma setup and all fail the same way when schema preparation does not run correctly.
- **Alternatives rejected**:
  - Keep setup in each test file: high duplication and inconsistent behavior.
  - Run schema setup only once globally: can create cross-suite state coupling and external database cleanup ambiguity.

## Decision: Treat vector schema as an explicit bootstrap concern

- **Decision**: Add or expose a deterministic vector schema setup path for Drizzle/pgvector tests.
- **Rationale**: Vector tests require the `embeddings` table and pgvector index before repository operations. This is separate from Prisma models.
- **Alternatives rejected**:
  - Manually create only the missing index: insufficient when the table itself does not exist.
  - Skip vector integration tests: violates the merge gate.
