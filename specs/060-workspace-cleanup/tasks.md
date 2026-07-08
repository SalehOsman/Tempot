# Tasks: Workspace Cleanup

**Feature**: 060-workspace-cleanup
**Date**: 2026-06-24
**Status**: SPEC APPROVED. Execution blocked by Rule LXXXV until both Spec #058 AND Spec #059 merge to `origin/main`. The tasks below are organized to be picked up immediately once the gate lifts.

Each task is independently verifiable. Order follows Q5 of `spec.md` (simplest first, refactor last). Cross-references: every `FR-` and `SC-` from `spec.md` is mapped to at least one task in this file.

## Phase 0 — Pre-Handoff Gate (Specification Phase)

| ID    | Task                                                                                                                                                          | Owner             | Status      | Verification                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------- |
| T000  | Resolve Q1–Q6 in `spec.md`; remove any `[NEEDS CLARIFICATION]` markers.                                                                                       | Project Manager   | DONE 2026-06-24 | `spec.md` `Specification Phase Status` confirms.                          |
| T001  | Run `/speckit.analyze` for Spec #060 and resolve any critical finding.                                                                                         | Technical Advisor | TODO        | Analyze output free of critical.                                              |
| T002  | Run `pnpm spec:validate:one 060-workspace-cleanup` and resolve any critical finding.                                                                            | Technical Advisor | TODO        | Command exit 0 for Spec #060.                                                 |
| T003  | Wait for Spec #058 to merge to `origin/main` (Rule LXXXV).                                                                                                     | Project Manager   | BLOCKED on #058 | `git log origin/main` shows Spec #058 merge commit.                       |
| T004  | Wait for Spec #059 to merge to `origin/main` (drain target requires audit to exist).                                                                            | Project Manager   | BLOCKED on #059 | `git log origin/main` shows Spec #059 merge commit; `pnpm methodology:lint --help` works. |
| T005  | After T003 and T004, rebase or recreate worktree `codex/060-workspace-cleanup` from `main` so it includes the merged Spec #058 and Spec #059 changes.           | Executor          | BLOCKED on T003, T004 | `git log` shows both merges as ancestors of HEAD.                       |
| T006  | Capture baseline `methodology-lint` evidence: `pnpm methodology:lint --format=json > implementation-notes-evidence/pre.json`. Commit under this spec branch.   | Executor          | BLOCKED on T005 | File present; contains six entries (5 owned by Spec #060 + 3 owned by #061). |

## Phase 1 — Stale Artifact Removal (covers FR-001, FR-001a, FR-001b, FR-001c, SC-005)

| ID    | Task                                                                                                                                                                                                | Depends on | Verification                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T010  | Investigate root cause for `apps/bot-server/src/bot-server.types.js`. Inspect `apps/bot-server/tsconfig*.json`, `apps/bot-server/package.json` scripts, and any emitter that targets `src/`.        | T006       | `implementation-notes.md` Phase 1 section documents either a reproducible cause OR an explicit "not reproducible" finding.               |
| T011  | If reproducible (T010), fix the cause (e.g., tighten `tsconfig.build.json` `outDir`, remove offending script). Add a regression unit test under `apps/bot-server/tests/unit/`.                       | T010       | After `pnpm build`, the artifact is not produced. Regression test fails BEFORE the fix and passes AFTER.                                  |
| T012  | If not reproducible (T010), extend `scripts/tempot/doctor.ts` with a health check that detects the artifact and prints a remediation hint. Add a unit test in `scripts/tempot/tests/unit/doctor.test.ts`. | T010       | `pnpm tempot doctor` surfaces the check; test passes.                                                                                     |
| T013  | Delete the local artifact: `Remove-Item 'F:\Tempot\apps\bot-server\src\bot-server.types.js'` (on the executor's machine). FR-001.                                                                    | T011 or T012 | `Test-Path` returns False locally.                                                                                                       |
| T014  | Remove the `staleArtifacts` entry for `apps/bot-server/src/bot-server.types.js` from `scripts/ci/methodology-lint.allowlist.json`. FR-001c.                                                          | T013       | `methodology-lint` audit count for `staleArtifacts` decreases by 1; entry no longer present in the JSON.                                  |
| T015  | Commit phase 1: `chore(060): remove stale bot-server.types.js artifact and drain allowlist entry`. Single commit grouping T011/T012, T013, T014.                                                     | T014       | `git log -1` shows the commit; methodology-lint passes for `bot-server.types.js`.                                                          |

## Phase 2 — Empty `utils/` Removal (covers FR-002, FR-002a, FR-002b)

| ID    | Task                                                                                                                                                  | Depends on | Verification                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| T020  | Confirm no source under `modules/user-management/` imports from `./utils/`. FR-002a.                                                                  | T015       | `git grep "from\s*['\"]\.\./utils" modules/user-management/` returns empty.                       |
| T021  | Delete the empty directory: `Remove-Item -Recurse 'modules/user-management/utils'`. FR-002.                                                            | T020       | Directory absent.                                                                                  |
| T022  | Remove the `staleArtifacts` entry for `modules/user-management/utils/` from `scripts/ci/methodology-lint.allowlist.json`. FR-002b.                    | T021       | Entry no longer in JSON; `methodology-lint` audit count decreases by 1.                            |
| T023  | Commit phase 2: `chore(060): remove empty user-management/utils directory and drain allowlist entry`.                                                  | T022       | `git log -1` shows the commit.                                                                      |

## Phase 3 — `abilities.ts` Translation (covers FR-004, FR-004a, FR-004b, FR-004c, SC-004)

| ID    | Task                                                                                                                                                                                  | Depends on | Verification                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| T030  | Translate every Arabic JSDoc block in `modules/user-management/abilities.ts` to English. Preserve every fact (role list, subject list, action list, contract relationship).            | T023       | English JSDoc reads naturally; meaning preserved.                                                            |
| T031  | Verify the diff contains only JSDoc text changes: `git diff modules/user-management/abilities.ts` shows no edits to executable code. FR-004a.                                          | T030       | Diff inspection.                                                                                             |
| T032  | Run `pnpm test:unit --filter user-management` and `pnpm test:integration --filter user-management`. Both MUST pass. FR-004b.                                                          | T031       | Test reports.                                                                                                |
| T033  | Grep the file for Arabic code points: `grep -P '[\x{0600}-\x{06FF}]' modules/user-management/abilities.ts` MUST return empty. FR-004, SC-004.                                          | T031       | Grep empty.                                                                                                  |
| T034  | Remove the `languagePolicy` entry for `modules/user-management/abilities.ts` from `scripts/ci/methodology-lint.allowlist.json`. FR-004c.                                                | T033       | Entry no longer present.                                                                                     |
| T035  | Commit phase 3: `docs(060): translate user-management abilities JSDoc to English and drain allowlist entry`.                                                                            | T034       | `git log -1` shows the commit.                                                                                |

## Phase 4 — `arabic-numerals.helper.ts` Reclassification (covers FR-005, FR-005a, FR-005b, FR-005c, FR-005d, SC-001)

| ID    | Task                                                                                                                                                                          | Depends on | Verification                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| T040  | Modify the allowlist entry for `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` in `scripts/ci/methodology-lint.allowlist.json` to the functional-data exemption shape per `data-model.md` Section 2. FR-005, FR-005a. | T035       | Entry now has `exemption_kind: 'functional-data'`, no `expires_at`, `reason ≥ 40 chars` mentioning "functional data". |
| T041  | Confirm the file itself is NOT modified: `git diff packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` returns empty. FR-005d.                                  | T040       | Diff empty.                                                                                         |
| T042  | Add a section to `implementation-notes.md` recording the proposed Spec #059 meta-linter amendment (per `plan.md` Section 7 / `data-model.md` Section 7). FR-005c.                | T040       | Section present.                                                                                    |
| T043  | Run `pnpm methodology:lint`. If the meta-linter rejects the entry shape (because the Spec #059 amendment has not landed yet), open a follow-up issue and mark T043 as blocked. | T042       | Audit either passes (amendment already landed) OR blocking issue opened and linked from implementation-notes.md. |
| T044  | Commit phase 4: `chore(060): reclassify arabic-numerals.helper.ts allowlist entry as permanent functional-data exemption`.                                                       | T043       | `git log -1` shows the commit.                                                                       |

## Phase 5 — `webhook-manager.ts` Refactor (covers FR-003, FR-003a, FR-003b, FR-003c, FR-003d, FR-003e, SC-003)

| ID    | Task                                                                                                                                                                                                                                                                | Depends on | Verification                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T050  | RED: Create `apps/bot-server/tests/unit/scripts/webhook-manager.test.ts` that imports `runSet`, `runDelete`, `runInfo` (do not exist yet), mocks `bot.api` (`setWebhook`, `deleteWebhook`, `getWebhookInfo`), and asserts dispatch behavior + the `info` field set. FR-003b. | T044       | Test fails because the helpers do not exist.                                                                                              |
| T051  | GREEN: Refactor `apps/bot-server/scripts/webhook-manager.ts`. Extract `runSet`, `runDelete`, `runInfo` as exported async helpers (each ≤ 50 lines). Reduce `main` to argv parsing + dispatcher (≤ 50 lines). Replace every `console.*` with `@tempot/logger` calls. FR-003a, FR-003c. | T050       | T050 passes. `pnpm lint apps/bot-server/scripts/webhook-manager.ts` returns zero warnings.                                                |
| T052  | Remove both `eslint-disable` directives from lines 1-2 of `apps/bot-server/scripts/webhook-manager.ts`. FR-003.                                                                                                                                                       | T051       | `grep -n 'eslint-disable' apps/bot-server/scripts/webhook-manager.ts` returns empty.                                                       |
| T053  | Run `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` (filtered to bot-server). All MUST pass. FR-003d, SC-003.                                                                                                                                                          | T052       | Three reports green.                                                                                                                       |
| T054  | Remove the `eslintDisable` entry for `apps/bot-server/scripts/webhook-manager.ts` from `scripts/ci/methodology-lint.allowlist.json`. FR-003e.                                                                                                                          | T053       | Entry no longer present.                                                                                                                   |
| T055  | Commit phase 5: `refactor(060): split webhook-manager main and route logs through @tempot/logger`. May be split into 2-3 commits (RED test, GREEN refactor + logger, allowlist drain) at executor discretion for review clarity.                                                  | T054       | `git log` shows the commit(s).                                                                                                              |

## Phase 6 — Evidence Capture and Documentation Sync (covers SC-001, SC-002)

| ID    | Task                                                                                                                                                                                              | Depends on | Verification                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| T060  | Capture post-cleanup `methodology-lint` evidence: `pnpm methodology:lint --format=json > implementation-notes-evidence/post.json`. SC-001.                                                          | T055       | File present.                                                                                                       |
| T061  | Diff `pre.json` and `post.json` and embed an excerpt in `implementation-notes.md` showing: zero entries owned by Spec #060, one functional-data exemption present, three entries owned by Spec #061 still pending. SC-001, SC-002. | T060       | Diff summary present in `implementation-notes.md`.                                                                  |
| T062  | Update `docs/ROADMAP.md`: add or update the Spec #060 row to "Complete" with merge commit reference.                                                                                                | T061       | ROADMAP line for #060 reflects current state; `pnpm docs:check` passes.                                              |
| T063  | Create `.changeset/060-workspace-cleanup.md` describing the drained debt and the reclassification.                                                                                                  | T062       | `pnpm changeset status` reports the new entry.                                                                       |
| T064  | Run `pnpm spec:validate:one 060-workspace-cleanup` and resolve any critical finding.                                                                                                                  | T063       | Exit 0 for Spec #060.                                                                                                 |

## Phase 7 — Verification (Rule LXXXIV)

| ID    | Task                                                                                                                                              | Depends on | Verification                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| T070  | Run `pnpm methodology:lint` locally; confirm exit 0. Record output snapshot in `implementation-notes.md`.                                          | T064       | Output snapshot stored.                                            |
| T071  | Run the full quality gate set: `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm docs:check`, `pnpm boundary:audit`, `pnpm authorization:check`, `pnpm module:checklist`, `pnpm source:conformance`, `pnpm toolchain:audit`. All MUST pass. | T070       | All gates green.                                                  |
| T072  | Open PR; request review per Superpowers `requesting-code-review`.                                                                                  | T071       | PR open.                                                            |

## Phase 8 — Finish

| ID    | Task                                                                                                                                          | Depends on | Verification                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| T080  | Address review findings.                                                                                                                       | T072       | Reviewers approve.                                                  |
| T081  | Merge to `main`. Update `docs/ROADMAP.md` Spec #060 row to "Complete".                                                                          | T080       | ROADMAP updated; merge commit linked.                               |
| T082  | Run `pnpm methodology:lint` on `main` head after merge; confirm green; store output under `docs/operations/methodology-lint/<date>-060-postmerge.txt`. | T081       | Output stored.                                                      |

## Phase 9 — Post-Merge Coordination

| ID    | Task                                                                                                                                                                                 | Owner             | Verification                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------ |
| T090  | Open follow-up Spec #059 amendment work item to add `exemption_kind: 'functional-data'` meta-linter support. Reference this spec's FR-005, FR-005c, and `data-model.md` Section 3.    | Project Manager   | Amendment work item created in `docs/ROADMAP.md` or issue tracker.    |
| T091  | Communicate Spec #060 completion to Spec #061 executor so the documentation drains can proceed.                                                                                       | Project Manager   | Spec #061 executor acknowledges.                                       |

## Out of Scope (for this spec)

- Translating Arabic prose in `docs/analysis-2026-06-10/`, `docs/analysis-2026-06-23/`, `docs/project-analysis/2026-06-07/`. Handled by Spec #061.
- Adding new methodology rules or audits. Handled by Spec #059.
- Refactoring any production runtime logic beyond `webhook-manager.ts`'s pure structural split.
- Amending Spec #059's source code directly; this spec only proposes the meta-linter amendment and documents it.

## Strategy (Resolved)

Sequential commits in order of risk: smallest first (FR-001, FR-002), then translation (FR-004), then reclassification (FR-005), then refactor (FR-003). Documentation sync last. Each commit is independently revertable. The allowlist file is always in sync with reality at HEAD.

## Estimated Effort

- Phase 0: completed (clarifications done) + wait time for Spec #058 AND #059 merges.
- Phase 1 (stale .js investigation + removal): 1–2 h (most time spent on root-cause investigation).
- Phase 2 (empty utils/ removal): 10 min.
- Phase 3 (abilities.ts translation): 30 min.
- Phase 4 (arabic-numerals reclassification): 20 min.
- Phase 5 (webhook-manager refactor + tests): 1.5 h.
- Phase 6 (evidence + docs): 30 min.
- Phase 7 (verification): 30 min.
- Phase 8 (review + merge): variable.
- Phase 9 (post-merge admin): 15 min.

Total Executor focused execution: ~4–5 hours.
Total calendar time: depends on #058 and #059 merge schedules.
