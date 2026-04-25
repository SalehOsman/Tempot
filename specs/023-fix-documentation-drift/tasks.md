# Fix Documentation Drift — Task Breakdown

**Feature:** 023-fix-documentation-drift
**Source:** spec.md (Clarified) + plan.md (Approved)
**Generated:** 2026-04-26

---

## Task 0: Branch Creation & Validation

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 5 min
**FR:** None (infrastructure)

**Steps**:
1. Create feature branch: `git checkout -b fix/023-documentation-drift`
2. Verify clean workspace: `git status` (no uncommitted changes)
3. Verify all tests pass: `pnpm test`
4. Verify no lint errors: `pnpm lint`

**Test file:** N/A (infrastructure only)

**Acceptance criteria**:
- [ ] Branch created successfully
- [ ] Clean workspace (no uncommitted changes)
- [ ] All tests pass
- [ ] No lint errors

---

## Task 1: Fix README.md Tech Stack Versions

**Priority:** P0 (User Story 1)
**Estimated time:** 10 min
**FR:** FR-001 (Accurate tech stack information)

**Files to modify**:
- `f:\Tempot\README.md` (lines 171, 173, 177)

**Changes**:
1. Line 171: Change "Vercel AI SDK 4.x" → "Vercel AI SDK 6.x"
2. Line 173: Change "neverthrow 8.x" → "neverthrow 8.2.0"
3. Line 177: Change "Vitest 4.x" → "Vitest 4.1.0"

**Verification steps**:
1. Compare with `f:\Tempot\CLAUDE.md` (lines 101, 103, 104)
2. Compare with `f:\Tempot\packages/ai-core/package.json` (line 26: "ai": "^6.0.0")
3. Compare with `f:\Tempot\packages/shared/package.json` for neverthrow version
4. Compare with `f:\Tempot\packages/shared/package.json` for vitest version

**Acceptance criteria**:
- [ ] README.md line 171 shows "Vercel AI SDK 6.x"
- [ ] README.md line 173 shows "neverthrow 8.2.0"
- [ ] README.md line 177 shows "Vitest 4.1.0"
- [ ] All versions match CLAUDE.md exactly
- [ ] All versions match actual package.json files

---

## Task 2: Fix README.md Package Status Table

**Priority:** P0 (User Story 2)
**Estimated time:** 10 min
**FR:** FR-002 (Accurate package status information)

**Files to modify**:
- `f:\Tempot\README.md` (lines 105, 106, 113, 119, 122)

**Changes**:
1. Line 105: Change `@tempot/ux-helpers` status "Building" → "Stable"
2. Line 106: Change `@tempot/ai-core` status "Planned" → "Stable"
3. Line 113: Change `@tempot/module-registry` status "Planned" → "Stable"
4. Line 119: Change `bot-server` status "Planned" → "Stable"
5. Line 122: Change `docs` status "Planned" → "Stable"

**Verification steps**:
1. Compare with `f:\Tempot\docs/archive/ROADMAP.md` (lines 23-44)
2. Verify actual implementation exists in `packages/ux-helpers/`
3. Verify actual implementation exists in `packages/ai-core/`
4. Verify actual implementation exists in `packages/module-registry/`
5. Verify actual implementation exists in `apps/bot-server/`
6. Verify actual implementation exists in `apps/docs/`

**Acceptance criteria**:
- [ ] README.md line 105 shows "Stable" for ux-helpers
- [ ] README.md line 106 shows "Stable" for ai-core
- [ ] README.md line 113 shows "Stable" for module-registry
- [ ] README.md line 119 shows "Stable" for bot-server
- [ ] README.md line 122 shows "Stable" for docs
- [ ] All statuses match ROADMAP.md exactly
- [ ] All packages/apps marked "Stable" have actual implementation

---

## Task 3: Create apps/docs/README.md

**Priority:** P1 (User Story 3)
**Estimated time:** 15 min
**FR:** FR-003 (Complete package documentation)

**Files to create**:
- `f:\Tempot\apps/docs/README.md` (new file)

**Content structure** (per Rule LX):
1. Purpose and description
2. Phase information
3. Dependencies list
4. Scripts/usage examples
5. Status

**Verification steps**:
1. Follow structure of `f:\Tempot\packages/shared/README.md`
2. Verify all sections present
3. Verify no hardcoded user-facing text (Rule XXXIX)
4. Verify English-only text (Rule XL)

**Acceptance criteria**:
- [ ] README.md exists in apps/docs/
- [ ] Contains Purpose section
- [ ] Contains Phase section
- [ ] Contains Dependencies table
- [ ] Contains Scripts section
- [ ] Contains Status section
- [ ] Follows Rule LX requirements
- [ ] No hardcoded user-facing text
- [ ] English-only text

---

## Task 4: Complete Test Module Spec Artifacts

**Priority:** P2 (User Story 4)
**Estimated time:** 20 min
**FR:** FR-004 (Complete spec artifacts)

**Files to create**:
- `f:\Tempot\specs/022-test-module/plan.md` (new file)
- `f:\Tempot\specs/022-test-module/tasks.md` (new file)
- `f:\Tempot\specs/022-test-module/data-model.md` (new file)
- `f:\Tempot\specs/022-test-module/research.md` (new file)

**Content strategy**:
- Keep artifacts minimal but complete
- Document temporary nature explicitly
- Reference ROADMAP.md for removal plan

**Verification steps**:
1. Follow SpecKit artifact structure
2. Include all required sections per Rules LXXIX–LXXXII
3. Document temporary nature in each artifact
4. Reference ROADMAP.md for removal plan

**Acceptance criteria**:
- [ ] plan.md exists with required sections
- [ ] tasks.md exists with required sections
- [ ] data-model.md exists with required sections
- [ ] research.md exists with required sections
- [ ] All artifacts document temporary nature
- [ ] All artifacts reference ROADMAP.md removal plan
- [ ] Follow SpecKit structure

---

## Task 5: Resolve @ts-expect-error in Tests

**Priority:** P2 (User Story 5)
**Estimated time:** 30 min
**FR:** FR-005 (TypeScript Strict Mode compliance)

**Files to modify**:
- `f:\Tempot\packages/session-manager/tests/unit/session.provider.test.ts` (lines 287, 293)

**Approach**: Remove @ts-expect-error and refactor tests

**Changes**:
1. Remove @ts-expect-error directive from line 287
2. Remove @ts-expect-error directive from line 293
3. Refactor tests to use alternative type validation methods
4. Ensure tests still verify type checking behavior

**Refactoring options**:
- Option A: Use separate test files with @ts-check instead
- Option B: Use runtime validation instead of type assertions
- Option C: Restructure tests to avoid type checking altogether

**Recommended**: Option A (separate test files with @ts-check)

**Verification steps**:
1. Run tests: `pnpm test --filter @tempot/session-manager`
2. Verify no TypeScript errors: `pnpm typecheck`
3. Verify no @ts-expect-error in any test file
4. Verify tests still pass

**Acceptance criteria**:
- [ ] Zero @ts-expect-error in session.provider.test.ts
- [ ] Zero @ts-expect-error in any test file
- [ ] All session-manager tests pass
- [ ] No TypeScript errors
- [ ] Tests still verify type checking behavior

---

## Task 6: Verification & Validation

**Priority:** P0 (quality gate)
**Estimated time:** 15 min
**FR:** None (quality gate)

**Steps**:
1. Run spec validation: `pnpm spec:validate`
2. Run all tests: `pnpm test`
3. Run lint: `pnpm lint`
4. Run typecheck: `pnpm typecheck`

**Expected results**:
- `pnpm spec:validate` passes with zero CRITICAL issues
- All tests pass
- No lint errors
- No TypeScript errors

**Acceptance criteria**:
- [ ] `pnpm spec:validate` passes with zero CRITICAL issues
- [ ] All tests pass
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] No build errors

---

## Task 7: Documentation Updates

**Priority:** P1 (documentation)
**Estimated time:** 10 min
**FR:** None (documentation)

**Files to modify**:
- `f:\Tempot\CHANGELOG.md` (add entry)
- `f:\Tempot\docs/archive/ROADMAP.md` (verify consistency, update if needed)

**CHANGELOG.md entry**:
```markdown
## [Unreleased]

### Fixed

- **Documentation**: Fixed documentation drift between README.md, CLAUDE.md, and ROADMAP.md
  - Updated Vercel AI SDK version from 4.x to 6.x
  - Updated package statuses to match ROADMAP.md
  - Added README.md to apps/docs/
  - Completed test-module spec artifacts
  - Removed @ts-expect-error from tests

Fixes: Rule L (Code-Documentation Parity) violations
```

**ROADMAP.md verification**:
- Verify no conflicts with README.md changes
- Update if inconsistencies found

**Acceptance criteria**:
- [ ] CHANGELOG.md updated with entry
- [ ] ROADMAP.md verified for consistency
- [ ] No conflicts between documentation files

---

## Task 8: Final Review & Commit

**Priority:** P0 (quality gate)
**Estimated time:** 10 min
**FR:** None (quality gate)

**Steps**:
1. Manual review of all changed files
2. Verify all acceptance criteria met
3. Commit with conventional commit message
4. Verify commit passes all checks

**Commit message**:
```
docs(readme): fix documentation drift - update tech stack and package status

- Update Vercel AI SDK version from 4.x to 6.x
- Update neverthrow version to 8.2.0
- Update Vitest version to 4.1.0
- Update package statuses to match ROADMAP.md
  - ux-helpers: Building → Stable
  - ai-core: Planned → Stable
  - module-registry: Planned → Stable
  - bot-server: Planned → Stable
  - docs: Planned → Stable
- Add README.md to apps/docs/
- Complete test-module spec artifacts (plan.md, tasks.md, data-model.md, research.md)
- Remove @ts-expect-error from session.provider.test.ts

Fixes: Rule L (Code-Documentation Parity) violations
Fixes: Rule LX (Package README Requirement) violation
Fixes: Rules LXXIX–LXXXII (Spec-Driven Development) violations
Fixes: Rule I / LXX (TypeScript Strict Mode) violations

Closes: #023
```

**Acceptance criteria**:
- [ ] All changed files reviewed manually
- [ ] All acceptance criteria from Tasks 1-7 met
- [ ] Commit created with conventional commit message
- [ ] Commit passes all checks

---

## Task Dependencies

```
Task 0 (Branch Creation)
  ↓
Task 1 (Fix Tech Stack) ──┐
  ↓                      │
Task 2 (Fix Status) ─────┤
  ↓                      │
Task 3 (Create README)    │
  ↓                      │
Task 4 (Complete Artifacts) │
  ↓                      │
Task 5 (Resolve @ts-expect-error) │
  ↓                      │
Task 6 (Verification) ────┘
  ↓
Task 7 (Documentation Updates)
  ↓
Task 8 (Final Review & Commit)
```

---

## Total Estimated Time

- Task 0: 5 min
- Task 1: 10 min
- Task 2: 10 min
- Task 3: 15 min
- Task 4: 20 min
- Task 5: 30 min
- Task 6: 15 min
- Task 7: 10 min
- Task 8: 10 min

**Total**: ~2 hours 5 minutes
