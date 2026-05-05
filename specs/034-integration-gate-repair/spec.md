# Feature Specification: Integration Gate Repair

**Feature Branch**: `codex/034-integration-gate-repair`
**Created**: 2026-05-05
**Status**: Draft
**Input**: Project Manager requested an independent task to repair repository-wide integration test failures discovered during Spec #031 verification.

## User Scenarios & Testing

### User Story 1 - Run integration tests without global pnpm assumptions (P1)

As a developer verifying a branch on Windows, Linux, or CI, I need integration tests to use workspace-local tooling so that `corepack pnpm test:integration` does not fail because `pnpm` is absent from the global PATH.

**Independent Test**: Remove any global `pnpm` shim from PATH, run `corepack pnpm test:integration`, and confirm no failure reports `'pnpm' is not recognized` or equivalent command-not-found output.

**Acceptance Criteria**:

1. **Given** dependencies are installed from `pnpm-lock.yaml`, **When** integration setup needs Prisma or Drizzle commands, **Then** it invokes workspace-local binaries or shared test helpers rather than global `pnpm`.
2. **Given** the root package script invokes `pnpm`, **When** the gate is run through Corepack, **Then** either the script path works without a global binary or the project documents and uses the approved `temp/bin` shim consistently.

### User Story 2 - Bootstrap test database schema consistently (P1)

As a developer relying on Testcontainers integration tests, I need every TestDB instance to prepare the Prisma and Drizzle schema before tests use repositories so that missing table failures cannot occur.

**Independent Test**: Run `corepack pnpm test:integration` and confirm failures for missing `UserProfile`, `AuditLog`, and `embeddings` tables are gone.

**Acceptance Criteria**:

1. **Given** a new TestDB instance starts, **When** tests request schema bootstrap, **Then** Prisma tables including `UserProfile` and `AuditLog` exist before Prisma operations run.
2. **Given** vector-search integration starts, **When** Drizzle vector tables are required, **Then** the `embeddings` table and pgvector index prerequisites exist before repository operations run.
3. **Given** several integration files run in the same Vitest project, **When** each file uses TestDB, **Then** setup remains isolated and deterministic without cross-suite state assumptions.

### User Story 3 - Preserve existing package behavior while repairing the gate (P2)

As the Project Manager, I need the repair to be scoped to test infrastructure and affected integration tests so that production package behavior does not change accidentally.

**Independent Test**: Review the diff and confirm production source changes are limited to reusable test infrastructure under the database package, with no unrelated service behavior changes.

**Acceptance Criteria**:

1. **Given** the repair is complete, **When** unit tests, lint, build, `cms:check`, `spec:validate`, `audit`, and `git diff --check` run, **Then** they pass or report only documented external environment blockers.
2. **Given** a release-impacting runtime package is not changed, **When** documentation sync is performed, **Then** no unnecessary changeset is added.

## Edge Cases

- TestDB runs with an externally supplied `DATABASE_URL` in CI.
- TestDB runs locally through Testcontainers with no `DATABASE_URL` set.
- Prisma schema generation has not been run before integration tests.
- Drizzle vector table setup and Prisma schema setup are both required in the same gate run.
- Multiple test files start TestDB instances in the same Vitest invocation.
- A failed schema bootstrap must surface a clear failing error instead of allowing later table-not-found assertions.

## Requirements

### Functional Requirements

- **FR-001**: Integration tests MUST NOT require a globally installed `pnpm` command.
- **FR-002**: The repair MUST provide a shared schema bootstrap path for Prisma-backed TestDB integration tests.
- **FR-003**: The repair MUST provide or reuse a deterministic setup path for Drizzle/pgvector integration tests.
- **FR-004**: TestDB setup MUST work with both Testcontainers-created databases and externally supplied `DATABASE_URL`.
- **FR-005**: The repair MUST remove duplicated shell command setup from affected integration test files when a shared helper is available.
- **FR-006**: The repair MUST keep production runtime behavior unchanged unless a direct test infrastructure dependency requires a minimal source fix.
- **FR-007**: The repair MUST keep all developer-facing code, comments, docs, and tests in English.
- **FR-008**: The repair MUST not introduce `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
- **FR-009**: The repair MUST not activate Rule XC deferred packages.
- **FR-010**: The repair MUST update SpecKit tasks and verification evidence before finish.

### Success Criteria

- **SC-001**: `corepack pnpm test:integration` runs without command-not-found errors for `pnpm`.
- **SC-002**: Integration failures for missing `UserProfile`, `AuditLog`, and `embeddings` tables are eliminated.
- **SC-003**: `corepack pnpm test:integration` passes in the repaired branch, or any remaining blocker is documented as an external service/container issue with exact output.
- **SC-004**: `corepack pnpm test:unit`, `corepack pnpm lint`, `corepack pnpm --recursive build`, `corepack pnpm spec:validate`, `corepack pnpm cms:check`, `corepack pnpm audit --audit-level=high`, and `git diff --check` pass before finish.
- **SC-005**: Diff scope is limited to Spec #034 artifacts, database test infrastructure, affected integration tests, and documentation sync.

## Key Entities

- **Integration Gate**: The repository-wide `test:integration` command and its dependent setup steps.
- **TestDB Harness**: The database test helper that creates or connects to PostgreSQL/pgvector and exposes Prisma access.
- **Schema Bootstrap**: The repeatable operation that prepares Prisma and Drizzle schema objects before assertions run.
- **Tool Invocation**: Any command executed by integration setup for Prisma, Drizzle, or package scripts.

## Assumptions

- The initial failures are reproduced from Spec #031 verification on 2026-05-05.
- The fix should prefer reusable test infrastructure over copying command fixes into each test file.
- The repair branch is independent from Spec #031 and docs-freshness tooling.
