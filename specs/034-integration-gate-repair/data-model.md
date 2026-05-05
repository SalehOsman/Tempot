# Data Model: Integration Gate Repair

No production database schema changes are planned.

## TestDB Harness

- **Purpose**: Owns lifecycle for integration-test PostgreSQL/pgvector databases.
- **Fields**:
  - `container`: local Testcontainers PostgreSQL container when no external database is supplied.
  - `pool`: PostgreSQL pool for bootstrap and test access.
  - `prisma`: PrismaClient bound to the active test database.
  - `usingExternalDb`: distinguishes CI/external database mode from local Testcontainers mode.
- **Relationships**:
  - Used by database, logger, settings, and package integration tests.

## Schema Bootstrap

- **Purpose**: Prepares database objects required before integration tests execute assertions.
- **States**:
  - `not-started`
  - `started`
  - `schema-ready`
  - `stopped`
- **Rules**:
  - Must run after `TestDB.start()`.
  - Must use the active `DATABASE_URL`.
  - Must be idempotent for repeated integration invocations.

## Tool Invocation

- **Purpose**: Represents any test setup call to Prisma or Drizzle tooling.
- **Rules**:
  - Must not require a global `pnpm` binary.
  - Must surface exact command failure output.
  - Must not swallow setup failures.
