# Fix Documentation Drift — Implementation Plan

**Feature:** 023-fix-documentation-drift
**Source:** spec.md (Clarified)
**Generated:** 2026-04-26

---

## Technical Approach

This is a **documentation-only fix** with no code changes to package functionality. All changes are to documentation files and spec artifacts.

### Architecture Impact

- **No architectural changes**
- **No dependency changes**
- **No API changes**
- **No database changes**

### Tech Stack

- **No new dependencies**
- **No version changes**
- **Existing tools**: pnpm, git, Vitest (for verification)

---

## Implementation Strategy

### Phase 1: Create Branch

1. Create feature branch: `fix/023-documentation-drift`
2. Verify clean workspace: no uncommitted changes
3. Verify all tests pass: `pnpm test`

### Phase 2: Fix README.md Tech Stack (User Story 1)

**File**: `f:\Tempot\README.md` (lines 160-180)

**Changes**:
- Line 171: Change "Vercel AI SDK 4.x" → "Vercel AI SDK 6.x"
- Line 173: Change "neverthrow 8.x" → "neverthrow 8.2.0" (match CLAUDE.md exact version)
- Line 175: Change "i18next 25.x" → "i18next 25.x" (already correct, verify)
- Line 177: Change "Vitest 4.x" → "Vitest 4.1.0" (match CLAUDE.md exact version)

**Verification**:
- Compare with `f:\Tempot\CLAUDE.md` (lines 101, 103, 104)
- Compare with `f:\Tempot\packages/ai-core/package.json` (line 26: "ai": "^6.0.0")
- Compare with `f:\Tempot\packages/shared/package.json` for neverthrow version
- Compare with `f:\Tempot\packages/shared/package.json` for vitest version

### Phase 3: Fix README.md Package Status (User Story 2)

**File**: `f:\Tempot\README.md` (lines 100-122)

**Changes**:
- Line 105: Change `@tempot/ux-helpers` status "Building" → "Stable" (ROADMAP.md shows Complete)
- Line 106: Change `@tempot/ai-core` status "Planned" → "Stable" (ROADMAP.md shows Complete)
- Line 113: Change `@tempot/module-registry` status "Planned" → "Stable" (ROADMAP.md shows Complete)
- Line 119: Change `bot-server` status "Planned" → "Stable" (ROADMAP.md shows Complete)
- Line 122: Change `docs` status "Planned" → "Stable" (ROADMAP.md shows Complete)

**Verification**:
- Compare with `f:\Tempot\docs/archive/ROADMAP.md` (lines 23-44)
- Verify actual implementation exists in packages/ and apps/

### Phase 4: Create apps/docs/README.md (User Story 3)

**File**: `f:\Tempot\apps/docs/README.md` (new file)

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

**Verification**:
- Follow Rule LX (Package README Requirement)
- Match structure of other package READMEs

### Phase 5: Complete Test Module Spec Artifacts (User Story 4)

**Directory**: `f:\Tempot\specs/022-test-module/`

**Create Files**:
1. `plan.md` — Technical implementation plan
2. `tasks.md` — Task breakdown
3. `data-model.md` — Data model (minimal for test module)
4. `research.md` — Technical research (minimal for test module)

**Content Strategy**:
- Keep artifacts minimal but complete
- Document temporary nature explicitly
- Reference ROADMAP.md for removal plan

**Verification**:
- Follow SpecKit artifact structure
- Include all required sections

### Phase 6: Resolve @ts-expect-error in Tests (User Story 5)

**File**: `f:\Tempot\packages/session-manager/tests/unit/session.provider.test.ts` (lines 287, 293)

**Decision Point**:
- **Option A**: Remove @ts-expect-error and refactor tests
- **Option B**: Create ADR documenting the exception

**Recommended Approach**: Option A (remove and refactor)
- Constitution Rule I and LXX prohibit @ts-expect-error without ADR
- No ADR exists for this exception
- Refactoring is straightforward: use separate test files or alternative validation

**Changes**:
- Remove @ts-expect-error directives
- Refactor tests to use alternative type validation methods
- Ensure tests still verify type checking behavior

**Verification**:
- All tests pass
- No TypeScript errors
- No @ts-expect-error in any test file

### Phase 7: Verification & Validation

**Run Commands**:
```bash
pnpm spec:validate                    # Verify spec→code alignment
pnpm test                            # Verify all tests pass
pnpm lint                            # Verify no lint errors
pnpm typecheck                       # Verify TypeScript compilation
```

**Acceptance Criteria**:
- ✅ `pnpm spec:validate` passes with zero CRITICAL issues
- ✅ All tests pass
- ✅ No lint errors
- ✅ No TypeScript errors
- ✅ README.md matches CLAUDE.md and package.json versions
- ✅ README.md matches ROADMAP.md status
- ✅ apps/docs/README.md exists
- ✅ specs/022-test-module/ has all artifacts
- ✅ Zero @ts-expect-error in test files

### Phase 8: Documentation Updates

**Update Files**:
1. `f:\Tempot\CHANGELOG.md` — Add entry for documentation fixes
2. `f:\Tempot\docs/archive/ROADMAP.md` — Update if needed (verify consistency)

**Commit Message Format**:
```
docs(readme): fix documentation drift - update tech stack and package status

- Update Vercel AI SDK version from 4.x to 6.x
- Update package statuses to match ROADMAP.md
- Add README.md to apps/docs/
- Complete test-module spec artifacts
- Remove @ts-expect-error from tests

Fixes: Rule L (Code-Documentation Parity) violations
```

---

## Risk Assessment

### Low Risk 🟢

- **No code changes to package functionality**
- **No dependency changes**
- **No architectural changes**
- **Reversible changes (documentation only)**

### Mitigation Strategies

1. **Backup**: Commit current state before changes
2. **Validation**: Run full test suite after each phase
3. **Review**: Manual review of all changed files
4. **Rollback**: Git revert if issues arise

---

## Success Metrics

1. ✅ All 5 user stories acceptance criteria met
2. ✅ `pnpm spec:validate` passes with zero CRITICAL issues
3. ✅ All existing tests continue to pass
4. ✅ No build errors or TypeScript errors
5. ✅ Rule L (Code-Documentation Parity) fully compliant
6. ✅ Rule LX (Package README Requirement) fully compliant
7. ✅ Rules LXXIX–LXXXII (Spec-Driven Development) fully compliant
8. ✅ Rule I / LXX (TypeScript Strict Mode) fully compliant

---

## Timeline Estimate

- **Phase 1**: 5 min (branch creation)
- **Phase 2**: 10 min (fix tech stack)
- **Phase 3**: 10 min (fix package status)
- **Phase 4**: 15 min (create apps/docs/README.md)
- **Phase 5**: 20 min (complete test-module artifacts)
- **Phase 6**: 30 min (resolve @ts-expect-error)
- **Phase 7**: 15 min (verification)
- **Phase 8**: 10 min (documentation updates)

**Total**: ~2 hours
