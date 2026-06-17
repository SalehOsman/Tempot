# Feature Specification: Quality Gates Hardening

**Feature Branch**: `codex/056-quality-gates-hardening`
**Created**: 2026-06-07
**Status**: Completion verified locally; local main merge pending
**Input**: Project audit findings that root CI omits application tests, bot-server has hidden failing tests, coverage policy is not enforced, documentation freshness is broken, and toolchain/documentation conformance has drifted.

## Clarifications

### Session 2026-06-07

- Q: Should existing hidden test failures be ignored while CI is expanded? -> A: No; the gate becomes required only after the failures are corrected at their source.
- Q: Should aggregate coverage alone remain the release metric? -> A: No; constitutional component thresholds must be enforced per governed layer.
- Q: Is documentation freshness advisory? -> A: No; active documentation drift is a required CI failure.
- Q: Which runtime versions must CI cover? -> A: The documented minimum Node.js version and the current supported release line.

## User Scenarios & Testing

### User Story 1 - Every Workspace Surface Runs in Required CI (Priority: P1)

A maintainer opens a pull request and receives required test results for apps,
packages, modules, and scripts, including bot-server and docs.

**Why this priority**: The principal root commands currently pass while direct
bot-server tests fail.

**Independent Test**: Introduce a temporary failing app test and confirm the
required CI job fails and identifies the workspace.

**Acceptance Scenarios**:

1. **Given** a failing bot-server test, **When** root CI runs, **Then** the pull request fails.
2. **Given** a failing docs app test, **When** root CI runs, **Then** the pull request fails.
3. **Given** all workspace tests pass, **When** CI completes, **Then** one report identifies every executed project and test count.

---

### User Story 2 - Coverage Policy Reflects Architectural Risk (Priority: P1)

A reviewer can trust that services, handlers, repositories, and conversations
meet their constitutional thresholds instead of being hidden by aggregate
coverage.

**Why this priority**: High coverage in one package currently masks weak
coverage in risk-sensitive components.

**Independent Test**: Lower one governed component below its threshold and
confirm coverage fails even when aggregate coverage remains high.

**Acceptance Scenarios**:

1. **Given** a service below 80%, **When** coverage runs, **Then** the required gate fails.
2. **Given** a handler below 70%, **When** coverage runs, **Then** the required gate fails.
3. **Given** a repository or conversation below its warning threshold, **When** coverage runs, **Then** the report identifies the component and policy result.
4. **Given** apps contain source code, **When** coverage runs, **Then** app files are represented in the report.

---

### User Story 3 - Documentation Drift Is Detected Automatically (Priority: P1)

A maintainer runs one root command and receives actionable failures for stale
active documentation, invalid frontmatter, or mismatches with current project
state.

**Why this priority**: The documented root freshness command does not exist and
the docs workspace command fails from its working directory.

**Independent Test**: Seed a stale active document and confirm the root
documentation quality command fails with its path and reason.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** `pnpm docs:freshness` runs, **Then** it resolves workspace paths correctly.
2. **Given** stale active README or roadmap content, **When** docs checks run, **Then** CI fails with actionable evidence.
3. **Given** archived historical content, **When** freshness runs, **Then** it follows an explicit archive policy rather than treating history as current guidance.

---

### User Story 4 - Toolchain and Code Policy Are Reproducible (Priority: P2)

A developer and CI use pinned compatible Node, pnpm, Vitest, and coverage
versions and receive automated findings for prohibited code/documentation
patterns.

**Why this priority**: Local direct pnpm and Corepack resolve different major
versions, CI does not test the minimum Node runtime, and coverage packages
drift.

**Independent Test**: Start from a clean checkout, activate Corepack, install,
and run the gate matrix with the pinned versions.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** the documented setup runs, **Then** the same pnpm major/version policy is used locally and in CI.
2. **Given** the minimum supported Node runtime, **When** CI runs, **Then** build and tests pass.
3. **Given** a prohibited lint suppression, hardcoded user-facing text, or non-English developer comment, **When** conformance checks run, **Then** the responsible file is reported.

### Edge Cases

- A workspace has no tests by design.
- Integration tests require unavailable Docker/Testcontainers infrastructure.
- A test file is renamed or moved under `apps/`.
- Generated code or vendored content should not count toward coverage.
- A repository threshold has too few executable lines for stable percentages.
- Documentation links to future roadmap content intentionally.
- Archived documentation contains stale versions by design.
- A package manager version is unavailable through Corepack.
- Coverage provider and Vitest patch versions differ.
- A script legitimately writes console output while production source may not.

## Requirements

### Functional Requirements

- **FR-001**: Required root test commands MUST execute all governed apps, packages, modules, and scripts.
- **FR-002**: Bot-server and docs app tests MUST be first-class CI projects.
- **FR-003**: Current bot-server failures MUST be corrected at their test-fixture or production source before the expanded gate is marked required.
- **FR-004**: CI MUST publish workspace/project test counts and identify omitted or testless governed projects.
- **FR-005**: Coverage MUST include application source and exclude only documented generated/vendor paths.
- **FR-006**: Service coverage below 80% and handler coverage below 70% MUST fail the required gate.
- **FR-007**: Repository coverage below 60% and conversation coverage below 50% MUST be visible according to the constitutional warning policy.
- **FR-008**: Coverage configuration MUST use compatible exactly aligned Vitest and coverage-provider versions.
- **FR-009**: Coverage policy MUST fail when a governed component drops below a blocking threshold even if aggregate coverage passes.
- **FR-010**: Root `pnpm docs:freshness` MUST exist and run successfully from the repository root.
- **FR-011**: Documentation scripts MUST resolve repository paths independently of package working directory.
- **FR-012**: Required documentation checks MUST include freshness, frontmatter, active README status, roadmap status, and critical configuration-name drift.
- **FR-013**: Active and archived documentation MUST follow explicit separate freshness policies.
- **FR-014**: Current stale root README, bot-server README, Compose comments, environment names, deployment instructions, and active module README gaps MUST be reconciled.
- **FR-015**: The root manifest MUST pin the approved package-manager release policy for Corepack.
- **FR-016**: CI MUST test the documented minimum Node.js runtime and the current supported runtime line.
- **FR-017**: Local instructions, CI, Docker, and roadmap MUST agree on Node and pnpm support.
- **FR-018**: Automated conformance MUST detect prohibited TypeScript suppression directives and unauthorized lint disables.
- **FR-019**: Automated conformance MUST detect hardcoded user-facing text and non-English developer-facing source comments in governed TypeScript.
- **FR-020**: Script-specific logging exceptions MUST be explicit and MUST NOT weaken production `src/` rules.
- **FR-021**: Every active package, app, and module MUST satisfy its documentation requirement or have an approved explicit exception.
- **FR-022**: Quality-gate failures MUST identify the command, workspace, file, and actionable reason.
- **FR-023**: Gate changes MUST be documented in the workflow guide and roadmap before merge.

### Key Entities

- **Test Project**: Governed workspace and its unit/integration/application test command.
- **Coverage Policy**: Component category, threshold, severity, include/exclude rules, and owner.
- **Documentation Freshness Rule**: Active path, source of truth, age/status rule, and exception.
- **Toolchain Baseline**: Node and pnpm versions tested and documented.
- **Conformance Finding**: File, rule, severity, evidence, and remediation.

## Success Criteria

- **SC-001**: Required CI executes and reports 100% of governed workspace test projects.
- **SC-002**: The two currently failing bot-server tests pass through corrected trace fixtures or source behavior.
- **SC-003**: A seeded failing app test fails the required root/CI gate.
- **SC-004**: A seeded below-threshold service or handler fails coverage even when aggregate coverage remains above 70%.
- **SC-005**: Application source appears in coverage reporting.
- **SC-006**: `pnpm docs:freshness` and docs frontmatter validation pass from the repository root.
- **SC-007**: All confirmed active documentation drift items in this scope are resolved.
- **SC-008**: Clean-checkout setup uses one pinned pnpm policy and passes on minimum supported Node.
- **SC-009**: Seeded suppression, hardcoded user text, and non-English comment fixtures are detected.
- **SC-010**: Zero Critical/High quality-gate findings remain after review.

## Assumptions

- Vitest remains the test runner.
- Existing CI workflows are extended rather than replaced wholesale.
- Testcontainers integration jobs may remain separate from fast unit jobs.
- Archive documents preserve history and are not rewritten as current guidance.

## Out of Scope

- Rewriting the test suite in another framework.
- Raising every non-blocking warning threshold in this feature.
- Product behavior changes unrelated to hidden test failures.
- Rewriting archived historical documentation.
