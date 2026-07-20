# Previous Analysis Reconciliation

This file tracks what changed compared with earlier project analysis folders and what still needs attention.

## Reviewed Prior Analysis Locations

| Path | Purpose |
|---|---|
| `docs/project-analysis/2026-06-07/` | Earlier project review and remediation program. |
| `docs/analysis-2026-06-10/` | Follow-up analysis. |
| `docs/analysis-2026-06-23/` | Follow-up analysis. |
| `docs/analysis-2026-07-07/` | Latest prior analysis before this package. |
| `docs/code-review-2025-05-18/` | Older code review evidence. |

## Resolved Or Improved Items

| Prior issue | Current status | Evidence |
|---|---|---|
| Spec #058 incomplete in the July 7 analysis. | Resolved. | `docs/ROADMAP.md` now says Spec #058 is implemented and merged to `main`. |
| App tests were previously omitted from coverage focus. | Improved. | `vitest.config.ts` includes app projects; `pnpm test:unit` passed 363 files and 2584 tests. |
| Stale source artifact `apps/bot-server/src/bot-server.types.js`. | Resolved. | File is no longer present in the workspace. |
| README state drift. | Improved. | Current README and bot-server README reflect newer project state. |
| Deferred packages under Rule XC. | Resolved by current documentation. | `docs/ROADMAP.md` states no packages remain deferred after Spec #008 activation. |

## Still Open

| Prior issue | Current status | Evidence |
|---|---|---|
| Production delivery gates open. | Still open. | `docs/ROADMAP.md` still requires external staging, monitoring/alerts, rollback, backup/restore, review, and final go/no-go evidence. |
| Active architecture doc language/encoding debt. | Still open. | `docs/architecture/tempot_architecture.md` remains allowlisted. |
| `eslint-disable` in webhook manager. | Still open. | `apps/bot-server/scripts/webhook-manager.ts` has file-level eslint-disable comments. |
| pnpm configuration drift. | Still open. | pnpm warns that `package.json#pnpm` is ignored. |
| AI/RAG runtime activation. | Partially improved, not fully active. | Foundation/spec artifacts exist, but roadmap still lists runtime activation and safety evidence requirements. |
| Governance allowlist debt. | Still open. | `scripts/ci/methodology-lint.allowlist.json` has 28 active entries. |

## Interpretation

The project has clearly improved since the previous analyses. Several concrete defects and stale-state issues have been resolved. The remaining work is now more concentrated around production evidence, governance debt, operational hardening, and deterministic quality gates.

The next review should not re-open resolved issues unless new evidence shows regression. It should focus on:

| Focus | Expected proof |
|---|---|
| Production readiness | Dated staging, monitoring, rollback, and backup/restore evidence. |
| Test reliability | Integration and coverage commands complete with artifacts. |
| Governance debt | Allowlist count reduced and architecture doc no longer allowlisted. |
| Security hardening | Secret scanning exists and webhook fallback secret is removed. |

