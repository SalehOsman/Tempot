# Requirements Quality Checklist: Quality Gates Hardening

**Purpose**: Validate CI, coverage, documentation, toolchain, and conformance requirements  
**Created**: 2026-06-07  
**Feature**: [spec.md](../spec.md)

## Test Completeness

- [x] CHK001 Are apps, packages, modules, and scripts explicitly included? [Completeness, Spec FR-001]
- [x] CHK002 Are current hidden failures required to be fixed before gate activation? [Consistency, Spec FR-003]
- [x] CHK003 Are omitted and testless projects reported? [Coverage, Spec FR-004]

## Coverage Policy

- [x] CHK004 Are all constitutional category thresholds represented with correct severity? [Consistency, Spec FR-006/FR-007]
- [x] CHK005 Is application source explicitly included? [Completeness, Spec FR-005]
- [x] CHK006 Is aggregate masking explicitly prevented? [Clarity, Spec FR-009]
- [x] CHK007 Are generated/vendor exclusions required to be documented? [Scope, Spec FR-005]

## Documentation Quality

- [x] CHK008 Is root invocation behavior explicit? [Clarity, Spec FR-010]
- [x] CHK009 Are working-directory independence and actionable errors required? [Clarity, Spec FR-011/FR-022]
- [x] CHK010 Are active and archive policies distinct? [Consistency, Spec FR-013]
- [x] CHK011 Are all confirmed stale documentation categories in scope? [Completeness, Spec FR-014/FR-021]

## Toolchain and Conformance

- [x] CHK012 Are minimum/current Node and pinned pnpm policies specified? [Completeness, Spec FR-015/FR-016]
- [x] CHK013 Is Vitest/coverage version alignment explicit? [Clarity, Spec FR-008]
- [x] CHK014 Are suppression, hardcoded text, and language rules testable? [Measurability, Spec FR-018/FR-019]
- [x] CHK015 Are tooling-script exceptions separated from production source policy? [Scope, Spec FR-020]

## Acceptance

- [x] CHK016 Do seeded failures prove each gate rather than relying on configuration review? [Acceptance, Spec SC-003/SC-004/SC-009]
- [x] CHK017 Is clean-checkout reproducibility measurable? [Acceptance, Spec SC-008]

## Notes

- No unresolved clarification marker remains.
