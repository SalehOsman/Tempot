# Tasks: Comprehensive Documentation Audit

**Feature**: 024-comprehensive-audit
**Source**: spec.md + plan.md

## Task 1: Complete Audit Artifacts

**Priority**: P0

**Steps**:
1. Add missing SpecKit artifacts for the audit spec.
2. Confirm the audit spec remains audit-only.
3. Verify `pnpm spec:validate` no longer reports missing artifacts for this spec.

**Acceptance criteria**:
- [ ] `plan.md` exists
- [ ] `tasks.md` exists
- [ ] `data-model.md` exists
- [ ] `research.md` exists
- [ ] `pnpm spec:validate` passes artifact checks for this spec

## Task 2: Document Rule XC Handling

**Priority**: P0

**Steps**:
1. Confirm deferred packages are identified from ROADMAP status.
2. Confirm all-package spec validation excludes deferred packages from blocking results.
3. Add unit coverage for deferred package filtering.

**Acceptance criteria**:
- [ ] Deferred packages do not block all-package validation
- [ ] Individual spec validation remains available for deferred package specs
- [ ] Unit test covers the filtering behavior

## Task 3: Reconcile Documentation Drift

**Priority**: P1

**Steps**:
1. Update roadmap status for implemented modules.
2. Update active specs that still show stale workflow status.
3. Re-run the validation gates.

**Acceptance criteria**:
- [ ] ROADMAP reflects current implementation status
- [ ] Active specs reflect current workflow status
- [ ] Validation commands complete with expected results
