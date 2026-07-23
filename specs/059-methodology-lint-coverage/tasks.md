# Tasks: Methodology Lint Coverage

**Feature**: 059-methodology-lint-coverage
**Date**: 2026-06-23
**Status**: SPEC APPROVED. Execution blocked by Rule LXXXV until Spec #058 merges to `origin/main`. Tasks below are organized to be picked up immediately once the gate lifts.

Each task is independently verifiable. Order is suggested but not strictly required; dependencies are annotated.

## Phase 0 — Pre-Handoff Gate (Specification Phase)

| ID    | Task                                                                                                                          | Owner             | Status      | Verification                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| T000  | Resolve Q1–Q6 in `spec.md`; remove `[NEEDS CLARIFICATION]` markers.                                                            | Project Manager   | DONE 2026-06-23 | spec.md `Specification Phase Status` confirms.                                                          |
| T001  | Run `/speckit.analyze` for Spec #059 and resolve any critical finding.                                                          | Technical Advisor | TODO        | Analyze output free of critical.                                                                            |
| T002  | Run `pnpm spec:validate --filter 059` and resolve any critical finding.                                                         | Technical Advisor | TODO        | Command exit 0 for Spec #059.                                                                               |
| T003  | Wait for Spec #058 to merge to `origin/main` (Rule LXXXV).                                                                      | Project Manager   | BLOCKED on #058 | `git log origin/main` shows Spec #058 merge commit.                                                       |
| T004  | After T003, create worktree `codex/059-methodology-lint-coverage` from `main` (Rule LXXXV).                                     | Executor          | BLOCKED on T003 | `git worktree list` shows the new path.                                                                  |

## Phase 1 — Foundation Libraries (TDD on each)

| ID    | Task                                                                                                                                                          | Depends on | Verification                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| T005  | RED+GREEN: `scripts/ci/lib/ts-token-scanner.ts` + `ts-token-scanner.test.ts` (state machine for code/string/template/lineComment/blockComment spans).         | T004       | Tests cover single/double/backtick, nested `${ ... }`, both comment styles, edge cases (escaped quotes, unterminated strings). ≥ 90% lines. |
| T006  | RED+GREEN: `scripts/ci/lib/audit-result.ts` defining `Violation`, `AuditResult`, formatting helpers, deterministic sort, exit handling.                       | T004       | Tests cover human/json line format, exit code 0/1/2, excerpt truncation at 120 chars, sort by `file:line:column`.            |
| T007  | RED+GREEN: `scripts/ci/lib/allowlist-loader.ts` parsing `methodology-lint.allowlist.json` and enforcing meta-linter rules (see `data-model.md`).               | T006       | Tests cover: valid file, missing fields exit 2, `expires_at > added_at + 90d` exit 2, dangling pattern exit 2, expired entry exit 1, soon-to-expire warning. |
| T008  | RED+GREEN: `scripts/ci/lib/report-formatter.ts` producing human / JSON / SARIF outputs.                                                                       | T006       | Tests cover all three formats; SARIF passes `@microsoft/sarif-sdk` validator if available, else schema check.                |
| T009  | RED+GREEN: `scripts/ci/lib/audit-runner.ts` providing CLI wrapper (`--format`, `--allowlist`, `--fixture-root`, `--silent`, `--quick`) used by each audit.    | T007, T008 | Tests cover argv parsing, allowlist loading, timing, error path producing exit code 2.                                       |

## Phase 2 — Audits (RED → GREEN → REFACTOR per audit)

| ID    | Task                                                                                                                                                                                                       | Depends on  | Verification                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T010  | Create test fixtures under `scripts/ci/tests/__fixtures__/` per `data-model.md` File Layout section.                                                                                                       | T009        | Fixture directory present; structure matches spec.                                                                                       |
| T011  | RED: `language-policy-audit.test.ts` (Arabic in .md, Arabic in .ts comment, Arabic in .ts string literal outside tests, Arabic in test string literal allowed, English passes, allowlisted path allowed). | T010, T005  | Tests fail as expected.                                                                                                                  |
| T012  | GREEN: `scripts/ci/language-policy-audit.ts` until T011 passes. Max 200 lines, max 50 lines per function.                                                                                                  | T011        | Tests pass; `pnpm lint` passes on file.                                                                                                  |
| T013  | Audit probe: run `tsx scripts/ci/language-policy-audit.ts` against the production tree (with the time-boxed allowlist in place). Audit MUST exit 0. Document output snippet in `implementation-notes.md`.   | T012        | Output stored.                                                                                                                           |
| T014  | RED: `stale-artifacts-audit.test.ts` (stale .js detected, empty utils/ detected, populated utils/ passes, dist/ ignored, fixtures isolated from production tree).                                          | T010, T006  | Tests fail.                                                                                                                              |
| T015  | GREEN: `scripts/ci/stale-artifacts-audit.ts`.                                                                                                                                                              | T014        | Tests pass; lint passes.                                                                                                                  |
| T016  | Audit probe: run against production tree; existing `bot-server.types.js` + empty `user-management/utils/` ARE in the allowlist; audit exits 0.                                                              | T015        | Output stored.                                                                                                                           |
| T017  | RED: `eslint-disable-audit.test.ts` (directive in script outside tests detected, directive inside tests allowed, .d.ts ignored, dist/ ignored).                                                            | T010, T006  | Tests fail.                                                                                                                              |
| T018  | GREEN: `scripts/ci/eslint-disable-audit.ts`.                                                                                                                                                               | T017        | Tests pass; lint passes.                                                                                                                  |
| T019  | Audit probe: run against production tree; existing `webhook-manager.ts` is in the allowlist; audit exits 0.                                                                                                | T018        | Output stored.                                                                                                                           |
| T019a | RED+GREEN: `telegram-keyboard-ux-audit.test.ts` and `scripts/ci/telegram-keyboard-ux-audit.ts` enforce Telegram inline keyboard row density, button label length, and Arabic/English locale coverage. | T018        | `pnpm telegram-keyboard-ux:check` exits 0 on the production tree.                                                                         |

## Phase 3 — Aggregator and CLI Surface

| ID    | Task                                                                                                                                                                          | Depends on              | Verification                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| T020  | RED: `methodology-lint.test.ts` mocking child_process; assert audit order, exit code mask, summary formatting, and three perf-test benchmarks covering every measurable NFR target — per-audit cold-cache benchmark (≤ 5 s), aggregator overhead benchmark (≤ 2 s beyond sum of audit durations), full aggregator perf-test regression benchmark (≤ 30 s on monorepo). | T009                    | Tests fail; the three NFR benchmarks each have an independent assertion in the test file.                          |
| T021  | GREEN: `scripts/ci/methodology-lint.ts` aggregator. Order: language-policy, stale-artifacts, eslint-disable, source-conformance, import-boundary, import-boundary-prisma, authorization-coverage, module-package-checklist, toolchain, test-project-inventory, documentation-claims, spec-validate, cms:check. | T012, T015, T018, T020 | Tests pass; manual run produces summary table per `data-model.md`.                                                |
| T022  | Add `"methodology:lint": "tsx scripts/ci/methodology-lint.ts"` and `"methodology:lint:quick": "tsx scripts/ci/methodology-lint.ts --quick"` to root `package.json`.              | T021                    | `pnpm methodology:lint --help` prints usage; `pnpm methodology:lint --format=json` outputs valid JSON.            |

## Phase 4 — Integration Touchpoints

| ID    | Task                                                                                                                                                                                                       | Depends on  | Verification                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T023  | Modify `.github/workflows/ci.yml` `methodology` job: replace per-audit steps with one `pnpm methodology:lint` step and add `actions/upload-artifact@v4` step uploading `methodology-lint-report.json`.       | T022        | CI run on the feature branch passes; artifact present in workflow run.                                            |
| T024  | Verify CI runtime delta is within ±30 s vs baseline. Document timing in `implementation-notes.md`.                                                                                                          | T023        | Timing snapshot stored.                                                                                            |
| T025  | Modify `.husky/pre-commit` to invoke `pnpm methodology:lint:quick`. Document in `docs/developer/workflow-guide.md`.                                                                                          | T022        | Local commit triggers the audit; failing commit blocked.                                                          |
| T026  | Update `scripts/tempot/doctor.ts` to call `pnpm methodology:lint:quick --silent` as one of its health checks and surface PASS/FAIL.                                                                          | T022        | `pnpm tempot doctor` shows methodology-lint status.                                                               |

## Phase 5 — Documentation Sync (Rule L)

| ID    | Task                                                                                                                                                                                       | Depends on  | Verification                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T027  | Create `docs/developer/methodology-lint.md` documenting each audit, exit codes, allowlist schema, output formats, performance budget, examples, and "How to add a new audit" recipe.       | T023        | File present; `pnpm docs:check` passes.                                                                            |
| T028  | Update `docs/developer/workflow-guide.md` to reference `methodology-lint.md`, the local pre-push command, and the pre-commit hook.                                                          | T027        | Link present.                                                                                                      |
| T029  | Add Spec #059 row in `docs/ROADMAP.md` with status, scope, evidence links, and allowlist debt counter.                                                                                       | T028        | ROADMAP updated; `pnpm docs:check` passes.                                                                         |

## Phase 6 — Constitution Amendment (Rule LIII)

| ID    | Task                                                                                                                                                                                                                                              | Depends on  | Verification                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T030  | Draft Constitution Amendment 2.6.0 (MINOR bump per Rule LIII): append an Enforcement marker line to Rule XL pointing to `methodology-lint`'s `language-policy-audit`. Include amendment entry in the constitution's amendment log.                  | T029        | Amendment text drafted in a separate commit. Reviewer (Project Manager) approves.                                  |
| T031  | Apply Amendment 2.6.0: update `.specify/memory/constitution.md` version header, Rule XL Enforcement marker, and amendment log entry.                                                                                                                | T030        | Constitution diff matches drafted amendment; commit message references Rule LIII.                                  |
| T032  | Add `.changeset/059-methodology-lint-coverage.md` describing the new tooling.                                                                                                                                                                       | T031        | `pnpm changeset status` reports the new entry.                                                                     |

## Phase 7 — Verification (Rule LXXXIV)

| ID    | Task                                                                                                                          | Depends on  | Verification                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T033  | Run `pnpm methodology:lint` locally; record output snapshot in `implementation-notes.md`.                                     | T032        | Output snapshot stored.                                                                                            |
| T034  | Run `pnpm spec:validate` for Spec #059; resolve any critical finding.                                                          | T032        | No critical findings.                                                                                              |
| T035  | Run `pnpm test:coverage` for `scripts/ci/`; confirm services tier threshold met (Rule XXXVI services ≥ 80%).                    | T032        | Coverage report meets threshold.                                                                                   |
| T036  | Open PR; request review per Superpowers `requesting-code-review`.                                                              | T035        | PR open.                                                                                                           |

## Phase 8 — Finish (Rule LXXXIV `finishing-a-development-branch`)

| ID    | Task                                                                                                                                                                          | Depends on  | Verification                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T037  | Address review findings.                                                                                                                                                       | T036        | Reviewers approve.                                                                                                 |
| T038  | Merge to `main`. Update `docs/ROADMAP.md` Spec #059 row to "Complete".                                                                                                         | T037        | ROADMAP updated; merge commit linked.                                                                              |
| T039  | Run `pnpm methodology:lint` on `main` head after merge; confirm green; store output under `docs/operations/methodology-lint/<date>-postmerge.txt`.                              | T038        | Output stored.                                                                                                     |

## Phase 9 — Post-Merge Admin (Project Manager, Not Code)

| ID    | Task                                                                                                                                                                                                          | Owner             | Verification                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| T040  | Update GitHub branch protection rules on `main` to require the `methodology` CI job (which now includes `methodology-lint`).                                                                                  | Project Manager   | Branch protection diff reviewed in GitHub settings.                                                                |
| T041  | Open Spec #060 (Workspace Cleanup) tasks to drain stale-artifacts + eslint-disable + Arabic comments allowlist entries.                                                                                       | Project Manager   | Spec #060 directory exists with `spec.md`.                                                                         |
| T042  | Open Spec #061 (Arabic Docs Translation or Removal) tasks to drain language-policy allowlist entries for analysis folders.                                                                                    | Project Manager   | Spec #061 directory exists with `spec.md`.                                                                         |
| T043  | Schedule monthly review of allowlist expiration; renewal requires explicit PM approval per spec Risks table.                                                                                                  | Project Manager   | Calendar item or operations runbook entry.                                                                          |

## Out of Scope (for this spec)

- Translating or removing existing Arabic documentation (`docs/analysis-2026-06-10/`, `docs/analysis-2026-06-23/`). Handled by Spec #061.
- Fixing the existing `eslint-disable` directives in `apps/bot-server/scripts/webhook-manager.ts`. Handled by Spec #060.
- Deleting the existing `apps/bot-server/src/bot-server.types.js`. Handled by Spec #060.
- Removing empty `utils/` directories in modules. Handled by Spec #060.
- Translating Arabic comments in `modules/user-management/abilities.ts` and `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts`. Handled by Spec #060.

## Strategy (Resolved)

**Strategy A** (Ship enforcement + time-boxed allowlist). The audits will pass on the very first CI run because the pre-existing violations are explicitly listed in `methodology-lint.allowlist.json` with `expires_at = 2026-09-23`. Spec #060 and Spec #061 then drain the allowlist entries by fixing the underlying violations. This is documented in spec.md and data-model.md.

## Estimated Effort

- Phase 0: completed (clarifications done) + wait time for Spec #058 merge.
- Phase 1 (foundation libs + tests): 3–4 h.
- Phase 2 (audits + tests + probes): 5–6 h.
- Phase 3 (aggregator + tests): 2 h.
- Phase 4 (CI + Husky + doctor): 1.5 h.
- Phase 5 (documentation sync): 1.5 h.
- Phase 6 (Constitution Amendment 2.6.0 + changeset): 1 h.
- Phase 7 (verification): 1 h.
- Phase 8 (review + merge): variable.
- Phase 9 (post-merge admin by Project Manager): 30 min.

Total Executor focused execution: ~15–17 hours.
Total calendar time: depends on #058 merge schedule and review iterations.
