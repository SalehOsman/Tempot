# Fix Documentation Drift — Technical Research

**Feature:** 023-fix-documentation-drift
**Source:** spec.md + plan.md
**Generated:** 2026-04-26

---

## Overview

This is a **documentation-only fix** with minimal technical research required. No new technologies, no architectural decisions, no complex implementations.

---

## Research Topic 1: Vercel AI SDK Version

### Question

What is the correct version of Vercel AI SDK used in the project?

### Investigation

**Sources Checked**:
1. `f:\Tempot\README.md` (line 171): "Vercel AI SDK 4.x"
2. `f:\Tempot\CLAUDE.md` (line 101): "Vercel AI SDK 6.x"
3. `f:\Tempot\packages/ai-core/package.json` (line 26): `"ai": "^6.0.0"`

### Finding

- **CLAUDE.md is correct**: Vercel AI SDK 6.x
- **README.md is incorrect**: Shows 4.x instead of 6.x
- **Actual code uses 6.x**: ai-core package.json confirms "ai": "^6.0.0"

### Decision

Update README.md to show "Vercel AI SDK 6.x" to match CLAUDE.md and actual code.

### References

- Vercel AI SDK GitHub: https://github.com/vercel/ai
- ADR-037: AI SDK v6 Upgrade (documents the upgrade from 4.x to 6.x)

---

## Research Topic 2: Package Status Accuracy

### Question

Which packages/apps are actually implemented vs. planned?

### Investigation

**Sources Checked**:
1. `f:\Tempot\README.md` (lines 100-122): Shows some packages/apps as "Planned"
2. `f:\Tempot\docs/archive/ROADMAP.md` (lines 23-44): Shows actual implementation status
3. `f:\Tempot\packages/` directory: Verified actual implementation exists
4. `f:\Tempot\apps/` directory: Verified actual implementation exists

### Findings

| Package/App | README.md Status | ROADMAP.md Status | Actual Implementation |
| ------------ | ---------------- | ----------------- | -------------------- |
| ux-helpers   | Building         | Complete          | ✅ Exists             |
| ai-core      | Planned          | Complete          | ✅ Exists             |
| module-registry | Planned      | Complete          | ✅ Exists             |
| bot-server   | Planned          | Complete          | ✅ Exists             |
| docs         | Planned          | Complete          | ✅ Exists             |

### Decision

Update README.md to show "Stable" for all implemented packages/apps to match ROADMAP.md.

### References

- Constitution Rule L: Code-Documentation Parity
- ROADMAP.md: Single source of truth for project status

---

## Research Topic 3: apps/docs/README.md Requirement

### Question

Is README.md required for apps/docs per Constitution?

### Investigation

**Sources Checked**:
1. Constitution Rule LX (Package README Requirement): "README.md required for every package and app directory"
2. `f:\Tempot\apps/docs/` directory: No README.md exists
3. `f:\Tempot\apps/bot-server/` directory: README.md exists
4. `f:\Tempot\packages/*/` directories: All have README.md

### Finding

- **Constitution Rule LX requires README.md** for all package and app directories
- **apps/docs/ is missing README.md** - violates Rule LX
- **All other packages/apps have README.md** - only apps/docs/ is missing

### Decision

Create apps/docs/README.md following the structure of other package READMEs.

### References

- Constitution Rule LX: Package README Requirement
- docs/archive/developer/package-creation-checklist.md: Checklist item #2

---

## Research Topic 4: Test Module Spec Artifacts

### Question

Should test-module have complete SpecKit artifacts despite being temporary?

### Investigation

**Sources Checked**:
1. Constitution Rules LXXIX–LXXXII: Spec-Driven Development requirements
2. `f:\Tempot\specs/022-test-module/spec.md`: Only spec.md exists
3. `f:\Tempot\specs/022-test-module/` directory: Missing plan.md, tasks.md, data-model.md, research.md
4. `f:\Tempot\docs/archive/ROADMAP.md`: Documents test-module as temporary

### Findings

- **Constitution Rules LXXIX–LXXXII require complete artifacts** for ALL specs
- **test-module is temporary** but not exempt from SpecKit requirements
- **Missing artifacts**: plan.md, tasks.md, data-model.md, research.md
- **Temporary nature should be documented** in artifacts, not used as excuse to skip them

### Decision

Create missing SpecKit artifacts (plan.md, tasks.md, data-model.md, research.md) for test-module, documenting its temporary nature in each artifact.

### References

- Constitution Rule LXXIX: Spec-Driven Development is Mandatory
- Constitution Rule LXXXI: SpecKit — Specification Toolchain
- Constitution Rule LXXXII: Handoff Gate — SpecKit → Superpowers

---

## Research Topic 5: @ts-expect-error in Tests

### Question

Is @ts-expect-error allowed in test files per Constitution?

### Investigation

**Sources Checked**:
1. Constitution Rule I: "STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable"
2. Constitution Rule LXX: "STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable"
3. `f:\Tempot\packages/session-manager/tests/unit/session.provider.test.ts`: Contains @ts-expect-error
4. ADRs directory: No ADR documents @ts-expect-error exception

### Findings

- **Constitution Rule I and LXX prohibit @ts-expect-error** without explicit ADR justification
- **@ts-expect-error exists in session.provider.test.ts** (lines 287, 293)
- **No ADR exists** documenting the exception
- **Current usage**: Tests type checking behavior by intentionally passing wrong shapes

### Decision

Remove @ts-expect-error and refactor tests to use alternative type validation methods. No ADR exists to justify the exception.

### Alternative Approaches

1. **Option A**: Remove @ts-expect-error, use separate test files with @ts-check
2. **Option B**: Create ADR documenting the exception
3. **Option C**: Restructure tests to avoid type checking altogether

**Recommended**: Option A (remove and refactor with @ts-check)

### References

- Constitution Rule I: TypeScript Strict Mode
- Constitution Rule LXX: Critical Bug-Fixing Methodology
- TypeScript Handbook: Type Checking JavaScript Files (@ts-check)

---

## Research Topic 6: Version Precision in Documentation

### Question

Should README.md show exact versions or version ranges?

### Investigation

**Sources Checked**:
1. `f:\Tempot\CLAUDE.md` (lines 88-109): Uses exact versions for critical deps, ranges for others
2. `f:\Tempot\README.md` (lines 160-180): Uses ranges for all versions
3. `f:\Tempot\packages/*/package.json`: Actual versions used

### Findings

**CLAUDE.md Pattern**:
- Exact versions for critical dependencies: typescript (5.9.3), vitest (4.1.0), neverthrow (8.2.0)
- Ranges for other dependencies: grammY (^1.41.1), Hono (4.x), Prisma (7.x)

**README.md Pattern**:
- Uses ranges for all versions: grammY (1.x), Hono (4.x), Vercel AI SDK (4.x), neverthrow (8.x)

### Decision

Update README.md to match CLAUDE.md pattern: exact versions for critical dependencies, ranges for others.

### Critical Dependencies (Exact Versions):
- TypeScript: 5.9.3
- Vitest: 4.1.0
- neverthrow: 8.2.0

### Non-Critical Dependencies (Ranges):
- grammY: 1.x
- Hono: 4.x
- Vercel AI SDK: 6.x
- Prisma: 7.x

### References

- CLAUDE.md: Tech Stack (Locked Versions)
- Constitution Rule LXXVI: Exact Version Pinning for Critical Dependencies

---

## Research Topic 7: Verification Commands

### Question

What commands should be run to verify documentation fixes?

### Investigation

**Sources Checked**:
1. Constitution Rule LXXXVI: Quality Gates
2. `f:\Tempot\package.json`: Available scripts
3. `f:\Tempot\docs/archive/developer/workflow-guide.md`: Verification steps

### Findings

**Required Verification Commands**:
1. `pnpm spec:validate` - Verify spec→code alignment (Rule LXXXVI: Reconciliation Gate)
2. `pnpm test` - Verify all tests pass (Rule XXXVIII: Zero-Defect Gate)
3. `pnpm lint` - Verify no lint errors (Rule XXXVIII: Zero-Defect Gate)
4. `pnpm typecheck` - Verify TypeScript compilation (Rule XXXVIII: Zero-Defect Gate)

### Decision

Run all four commands in sequence after each phase of changes.

### References

- Constitution Rule LXXXVI: Quality Gates
- Constitution Rule XXXVIII: Zero-Defect Gate

---

## Research Summary

### Key Findings

1. **Vercel AI SDK**: README.md shows 4.x, should be 6.x (CLAUDE.md and actual code confirm 6.x)
2. **Package Status**: 5 packages/apps mislabeled as "Planned" in README.md, should be "Stable"
3. **apps/docs/README.md**: Missing, violates Constitution Rule LX
4. **Test Module**: Missing 4 SpecKit artifacts, violates Rules LXXIX–LXXXII
5. **@ts-expect-error**: Exists in tests without ADR, violates Rule I/LXX
6. **Version Precision**: README.md uses ranges for all, should match CLAUDE.md pattern
7. **Verification**: 4 commands required (spec:validate, test, lint, typecheck)

### Decisions Made

1. Update README.md tech stack to match CLAUDE.md and actual code
2. Update README.md package status to match ROADMAP.md
3. Create apps/docs/README.md following package README structure
4. Create missing test-module SpecKit artifacts
5. Remove @ts-expect-error and refactor tests
6. Follow CLAUDE.md version precision pattern
7. Run 4 verification commands after each phase

### No Further Research Required

All research topics resolved. No new technologies, no architectural decisions, no complex implementations. This is a straightforward documentation fix.
