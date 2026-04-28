# Boundary Remediation Plan

**Status**: Closed baseline artifact for spec #026
**Purpose**: Resolve boundary drift in staged, low-risk slices.

## Principles

- Fix documentation and governance before production rewrites.
- Promote checks gradually: document, report, enforce.
- Keep deferred packages excluded until activated.
- Do not change module behavior while producing this planning slice.
- Every future code change must include tests or validation gates.

## Remediation Items

| Item | Source finding | Priority | Scope | Validation |
| --- | --- | --- | --- | --- |
| REM-001 | BND-001 | P1 | Add tracked-file import audit script | ✅ `pnpm boundary:audit` with unit tests and CI blocking gate |
| REM-002 | BND-002 | P2 | Update architecture docs for `national-id-parser` and `.agents/skills` | `pnpm spec:validate`, docs review |
| REM-003 | BND-003 | P2 | Add deferred package policy note to validators and guides | Deferred package check stays non-critical |
| REM-004 | BND-004 | P1 | Ensure audit tools use `git ls-files` only | ✅ `scripts/ci/import-boundary-audit.ts` uses `git ls-files` |
| REM-005 | BND-005 | P2 | Keep app composition root documented | Boundary guide review |
| REM-006 | BND-006 | P3 | Add module-internal relative import guidance | Module boundary guide review |
| REM-007 | BND-007 | P3 | Document docs app ingestion exception | CI enforcement plan review |

## Proposed Execution Order

1. Add a documentation-only governance baseline.
2. Add blocking import audit.
3. Add blocking module checklist validation.
4. Review package-to-package edges manually before hard blocking.

## Blast Radius Controls

- Do not rewrite existing package imports as part of report creation.
- Do not modify active module behavior until a specific violation is proven.
- Do not activate deferred packages as part of this track.
- Keep ADR updates in the same slice as the decision they support.

## Exit Criteria

- Boundary inventory exists.
- Dependency rules exist.
- Audit report exists.
- Report-only enforcement plan exists.
- Roadmap reflects the architecture hardening track.
- CI blocks tracked import violations.
- CI blocks active module package checklist regressions.
- `pnpm spec:validate` and `git diff --check` pass.
