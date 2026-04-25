# Feature Specification: Fix Documentation Drift

**Feature Branch**: `023-fix-documentation-drift`
**Created**: 2026-04-26
**Status**: Specification Phase
**Input**: Project audit identified 4 documentation compliance issues requiring immediate resolution

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Accurate Tech Stack Information (Priority: P0)

As a developer reading the project README, I want accurate technology version information so that I can correctly understand the project's dependencies and compatibility requirements.

**Why this priority**: Critical for Rule L (Code-Documentation Parity) - inaccurate documentation misleads developers and violates the Constitution.

**Independent Test**: Verify README.md tech stack table matches actual package.json versions for all listed packages.

**Acceptance Scenarios**:

1. **Given** the README.md Tech Stack table, **When** I compare each version with the actual package.json in the corresponding package, **Then** all versions match exactly.
2. **Given** the README.md Tech Stack table, **When** I compare with CLAUDE.md tech stack table, **Then** there are no discrepancies between the two files.

---

### User Story 2 - Accurate Package Status Information (Priority: P0)

As a developer reading the project README, I want accurate package status information so that I can understand which packages are implemented and which are planned.

**Why this priority**: Critical for Rule L (Code-Documentation Parity) - mislabeling implemented packages as "Planned" violates the Constitution.

**Independent Test**: Verify README.md package status table matches ROADMAP.md for all packages.

**Acceptance Scenarios**:

1. **Given** the README.md Services table, **When** I compare each package status with ROADMAP.md, **Then** all statuses match exactly.
2. **Given** the README.md Applications table, **When** I compare each app status with ROADMAP.md, **Then** all statuses match exactly.

---

### User Story 3 - Complete Package Documentation (Priority: P1)

As a developer exploring the codebase, I want README.md files in all package and app directories so that I can understand each component's purpose and API.

**Why this priority**: Required by Constitution Rule LX (Package README Requirement) - every package/app must have README.md.

**Independent Test**: Verify all packages/ and apps/ directories contain README.md files.

**Acceptance Scenarios**:

1. **Given** the apps/docs directory, **When** I list its contents, **Then** README.md exists with proper structure (Purpose, API, Dependencies, Status).
2. **Given** all packages/ directories, **When** I verify each has README.md, **Then** none are missing.

---

### User Story 4 - Complete Spec Artifacts for Test Module (Priority: P2)

As a developer reviewing the test-module spec, I want complete SpecKit artifacts so that I understand the full design rationale and implementation plan.

**Why this priority**: Required by Constitution Rules LXXIX–LXXXII (Spec-Driven Development) - all specs must have complete artifacts unless explicitly deferred.

**Independent Test**: Verify specs/022-test-module/ contains all required artifacts.

**Acceptance Scenarios**:

1. **Given** specs/022-test-module/, **When** I list its contents, **Then** plan.md, tasks.md, data-model.md, and research.md exist (in addition to spec.md).
2. **Given** the test-module is marked as "Temporary", **When** I review ROADMAP.md, **Then** the temporary nature and removal plan are clearly documented.

---

### User Story 5 - TypeScript Strict Mode Compliance in Tests (Priority: P2)

As a developer running tests, I want zero @ts-expect-error directives in test files so that type safety is enforced uniformly across the codebase.

**Why this priority**: Constitution Rule I and LXX prohibit @ts-expect-error without explicit ADR justification. Current usage lacks documented exception.

**Independent Test**: Verify no @ts-expect-error exists in test files unless documented in an ADR.

**Acceptance Scenarios**:

1. **Given** all test files in packages/, **When** I search for @ts-expect-error, **Then** no occurrences exist, OR each occurrence is documented in an ADR.
2. **Given** session.provider.test.ts currently uses @ts-expect-error, **When** I review the test, **Then** either the @ts-expect-error is removed OR an ADR is created documenting the exception.

## Edge Cases & Clarifications

### Edge Case 1: Test Module Temporary Status

**Question**: Should test-module have full SpecKit artifacts if it's temporary?

**Resolution**: Yes. Constitution Rules LXXIX–LXXXII apply to ALL specs regardless of temporary status. The temporary nature should be documented in ROADMAP.md and in the spec itself, but complete artifacts are still required for transparency and audit trail.

### Edge Case 2: @ts-expect-error for Type-Level Testing

**Question**: Is @ts-expect-error acceptable for testing TypeScript's type checking behavior?

**Resolution**: No, unless documented in an ADR. Constitution Rule I and LXX prohibit @ts-expect-error without explicit justification. If type-level testing is needed, either:
- Create an ADR documenting the exception, OR
- Refactor tests to avoid @ts-expect-error (e.g., use separate .test.ts files with @ts-check instead of @ts-expect-error)

### Edge Case 3: Version Precision in Documentation

**Question**: Should README.md show exact versions (e.g., "6.0.0") or version ranges (e.g., "6.x")?

**Resolution**: Follow CLAUDE.md convention. CLAUDE.md uses exact versions for critical dependencies (typescript: 5.9.3, vitest: 4.1.0, neverthrow: 8.2.0) and ranges for others. README.md should match this pattern for consistency.

## Non-Requirements

- No code changes to package functionality
- No new features or functionality
- No architectural decisions (ADR not required for documentation fixes)
- No database migrations or schema changes
- No new tests required (existing tests remain valid)

## Out of Scope

- Fixing any other documentation issues not identified in this spec
- Updating ROADMAP.md beyond verifying consistency with README.md
- Creating ADRs for @ts-expect-error (this is a decision point, not part of this spec)
- Refactoring test logic (only removing @ts-expect-error if no ADR exists)

## Dependencies

- None (documentation-only change)

## Success Criteria

1. ✅ README.md Tech Stack table matches CLAUDE.md and actual package.json versions
2. ✅ README.md Services table matches ROADMAP.md status for all packages
3. ✅ README.md Applications table matches ROADMAP.md status for all apps
4. ✅ apps/docs/README.md exists with proper structure
5. ✅ specs/022-test-module/ contains plan.md, tasks.md, data-model.md, research.md
6. ✅ Zero @ts-expect-error in test files OR documented in ADR
7. ✅ All changes pass `pnpm spec:validate` with zero CRITICAL issues
8. ✅ All existing tests continue to pass
9. ✅ No build errors or TypeScript errors
