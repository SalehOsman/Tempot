# Tasks: Arabic Docs Translation or Removal

**Feature**: 061-arabic-docs-translation-or-removal
**Date**: 2026-06-24
**Status**: SPEC APPROVED. Execution blocked by Rule LXXXV until both Spec #058 AND Spec #059 merge to `origin/main`.

Each task is independently verifiable. Order follows Q3 of `spec.md` (highest-value files first per directory). Cross-references: every `FR-` and `SC-` from `spec.md` is mapped to at least one task.

## Phase 0 — Pre-Handoff Gate

| ID    | Task                                                                                                                                       | Owner             | Status      | Verification                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ----------- | ------------------------------------------------------------------------- |
| T000  | Resolve Q1–Q8 in `spec.md`; remove any `[NEEDS CLARIFICATION]` markers.                                                                    | Project Manager   | DONE 2026-06-24 | `spec.md` confirms.                                                    |
| T001  | Run `/speckit.analyze` for Spec #061; resolve any critical finding.                                                                          | Technical Advisor | TODO        | Analyze output free of critical.                                          |
| T002  | Run `pnpm spec:validate:one 061-arabic-docs-translation-or-removal`; resolve any critical finding.                                          | Technical Advisor | TODO        | Exit 0 for Spec #061.                                                     |
| T003  | Wait for Spec #058 merge to `origin/main` (Rule LXXXV).                                                                                     | Project Manager   | BLOCKED     | `git log origin/main` shows the merge.                                     |
| T004  | Wait for Spec #059 merge to `origin/main` (the audit must exist before draining its allowlist).                                              | Project Manager   | BLOCKED     | `git log origin/main` shows the merge; `pnpm methodology:lint --help` works. |
| T005  | After T003 and T004, rebase or recreate worktree `codex/061-arabic-docs-translation-or-removal` from `main`.                                  | Executor          | BLOCKED     | `git log` shows both merges as ancestors of HEAD.                          |
| T006  | Capture pre-translation structural snapshots for every file in `docs/analysis-2026-06-10/` and `docs/analysis-2026-06-23/` per `data-model.md` Section 2; store in `implementation-notes.md`. | Executor | BLOCKED on T005 | Snapshots in `implementation-notes.md`. |
| T007  | Capture baseline `methodology-lint` evidence: `pnpm methodology:lint --format=json > implementation-notes-evidence/pre.json`.                | Executor          | BLOCKED on T005 | File present; contains 3 entries owned by Spec #061.                       |

## Phase 1 — Reclassify `project-analysis/2026-06-07/` (covers FR-003, FR-003a, FR-003b, FR-003c)

| ID    | Task                                                                                                                                                          | Depends on | Verification                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| T010  | Remove the `languagePolicy` allowlist entry for `docs/project-analysis/2026-06-07/**` from `scripts/ci/methodology-lint.allowlist.json`. FR-003.                | T007       | `grep -F 'docs/project-analysis/2026-06-07' scripts/ci/methodology-lint.allowlist.json` returns empty. |
| T011  | Verify the two files in the directory are NOT modified: `git diff docs/project-analysis/2026-06-07/` returns empty. FR-003a.                                    | T010       | Diff empty.                                                                                            |
| T012  | Add a "Misclassification Discovery" section to `implementation-notes.md` recording the discovery date, evidence, and Spec #059 maintenance recommendation. FR-003b. | T010       | Section present.                                                                                       |
| T013  | Run `pnpm methodology:lint`; verify exit 0 and that the directory is no longer audited via allowlist. FR-003c.                                                  | T012       | Output snapshot.                                                                                       |
| T014  | Commit phase 1: `chore(061): remove misclassified project-analysis/2026-06-07 allowlist entry`.                                                                  | T013       | `git log -1` shows the commit.                                                                          |

## Phase 2 — Translate `analysis-2026-06-10/` (covers FR-001, FR-001a, FR-001b, FR-001c, FR-001d, SC-002)

Each per-file task asserts the structural snapshot from `data-model.md` Section 3 and runs `pnpm docs:check` before commit.

| ID    | Task                                                                                                | Depends on | Verification                                                            |
| ----- | --------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| T020  | Translate `docs/analysis-2026-06-10/00-executive-summary.md` to English. FR-001, FR-001a, FR-001b.   | T014       | Snapshot assertions pass; `docs:check` passes; commit.                  |
| T021  | Translate `docs/analysis-2026-06-10/09-issues-and-risks-register.md`.                                  | T020       | Same as above.                                                          |
| T022  | Translate `docs/analysis-2026-06-10/10-fix-plan.md`.                                                  | T021       | Same.                                                                   |
| T023  | Translate `docs/analysis-2026-06-10/12-final-recommendations.md`.                                     | T022       | Same.                                                                   |
| T024  | Translate `docs/analysis-2026-06-10/01-project-structure-analysis.md`.                                | T023       | Same.                                                                   |
| T025  | Translate `docs/analysis-2026-06-10/02-code-quality-analysis.md`.                                     | T024       | Same.                                                                   |
| T026  | Translate `docs/analysis-2026-06-10/03-architecture-analysis.md`.                                     | T025       | Same.                                                                   |
| T027  | Translate `docs/analysis-2026-06-10/04-docker-and-devops-analysis.md`.                                | T026       | Same.                                                                   |
| T028  | Translate `docs/analysis-2026-06-10/05-security-analysis.md`.                                         | T027       | Same.                                                                   |
| T029  | Translate `docs/analysis-2026-06-10/06-dependencies-analysis.md`.                                     | T028       | Same.                                                                   |
| T030  | Translate `docs/analysis-2026-06-10/07-testing-and-quality-gates-analysis.md`.                        | T029       | Same.                                                                   |
| T031  | Translate `docs/analysis-2026-06-10/08-methodology-analysis.md`.                                      | T030       | Same.                                                                   |
| T032  | Translate `docs/analysis-2026-06-10/11-improvement-and-development-roadmap.md` AND remove the `languagePolicy` allowlist entry for `docs/analysis-2026-06-10/**`. FR-001c. | T031       | Snapshot assertions pass; allowlist count for `languagePolicy` decreases by 1; commit message: `docs(061): translate last 2026-06-10 analysis file and drain allowlist entry`. |
| T033  | Run `grep -rP '[\p{Arabic}]' docs/analysis-2026-06-10/`; assert empty. SC-002.                         | T032       | Empty grep result.                                                      |

## Phase 3 — Translate `analysis-2026-06-23/` (covers FR-002, FR-002a, FR-002b, FR-002c, FR-002d, SC-002)

Same pattern as Phase 2 applied to the second directory's 14 files. The exact filename list is captured in `implementation-notes.md` from the live state of `main` after Spec #059 merges.

| ID    | Task                                                                                                                                                              | Depends on | Verification                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| T040  | Translate `docs/analysis-2026-06-23/00-executive-summary.md` (or equivalent highest-priority file). FR-002, FR-002a.                                              | T033       | Snapshot assertions pass; `docs:check` passes; commit.                  |
| T041  | Translate `docs/analysis-2026-06-23/09-issues-and-risks-register.md` (or equivalent).                                                                              | T040       | Same.                                                                   |
| T042  | Translate `docs/analysis-2026-06-23/10-fix-plan.md` (or equivalent).                                                                                                | T041       | Same.                                                                   |
| T043  | Translate `docs/analysis-2026-06-23/12-final-recommendations.md` (or equivalent).                                                                                   | T042       | Same.                                                                   |
| T044  | Translate `docs/analysis-2026-06-23/01-...` through `08-...` (8 commits) in numerical order. FR-002b cross-references.                                              | T043       | Per-file commit; same checks.                                           |
| T045  | Translate `docs/analysis-2026-06-23/11-...` (or equivalent intermediate file).                                                                                      | T044       | Same.                                                                   |
| T046  | Translate `docs/analysis-2026-06-23/<last file>` AND remove the `languagePolicy` allowlist entry for `docs/analysis-2026-06-23/**`. FR-002c.                       | T045       | Allowlist entry removed; commit.                                        |
| T047  | Run `grep -rP '[\p{Arabic}]' docs/analysis-2026-06-23/`; assert empty. SC-002.                                                                                       | T046       | Empty grep.                                                              |

## Phase 4 — Evidence Capture and Documentation Sync (covers SC-001, SC-003, SC-004, FR-004, FR-004a)

| ID    | Task                                                                                                                                                          | Depends on | Verification                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| T050  | Capture post-translation `pnpm methodology:lint --format=json > implementation-notes-evidence/post.json`. SC-001, FR-004.                                     | T047       | File present.                                                                         |
| T051  | Diff `pre.json` and `post.json`; embed an excerpt in `implementation-notes.md` showing zero entries owned by Spec #061. FR-004.                                 | T050       | Diff summary in `implementation-notes.md`.                                            |
| T052  | Run `pnpm docs:check`; verify zero failures. SC-003.                                                                                                            | T051       | Output green.                                                                         |
| T053  | Run `pnpm methodology:lint`; verify exit 0. SC-004.                                                                                                              | T052       | Exit 0.                                                                                |
| T054  | Update `docs/ROADMAP.md` Spec #061 row to "Complete" with merge commit reference (filled in at merge time).                                                      | T053       | ROADMAP line for #061 reflects the change; `docs:check` passes.                        |
| T055  | Create `.changeset/061-arabic-docs-translation-or-removal.md`.                                                                                                    | T054       | `pnpm changeset status` lists the new entry.                                           |
| T056  | Add a "PR description excerpt" section to `implementation-notes.md` linking to the snapshots. FR-004a.                                                           | T055       | Section present.                                                                      |
| T057  | Run `pnpm spec:validate:one 061-arabic-docs-translation-or-removal`; resolve any finding.                                                                          | T056       | Exit 0 for Spec #061.                                                                  |

## Phase 5 — Verification (Rule LXXXIV)

| ID    | Task                                                                                                                                                       | Depends on | Verification                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| T060  | Run the full quality gate set: `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm docs:check`, `pnpm spec:validate`. All MUST pass. | T057       | All gates green.                                                       |
| T061  | Open PR; request review per Superpowers `requesting-code-review`.                                                                                           | T060       | PR open.                                                                |

## Phase 6 — Finish

| ID    | Task                                                                                                                                                  | Depends on | Verification                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| T070  | Address review findings.                                                                                                                               | T061       | Reviewers approve.                                                      |
| T071  | Merge to `main`. Update `docs/ROADMAP.md` Spec #061 row with merge commit hash.                                                                          | T070       | ROADMAP updated; merge commit linked.                                   |
| T072  | Run `pnpm methodology:lint` on `main` head after merge; confirm green; store output under `docs/operations/methodology-lint/<date>-061-postmerge.txt`.  | T071       | Output stored.                                                          |

## Phase 7 — Post-Merge Coordination

| ID    | Task                                                                                                                                                                                  | Owner             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| T080  | Open a Spec #059 maintenance work item recommending removal of the `docs/project-analysis/2026-06-07/**` pattern from any seed-generation script. Reference Spec #061 FR-003, FR-003b. | Project Manager   |
| T081  | Notify Project Manager that all Spec #059 allowlist entries owned by Specs #060 and #061 have been drained or reclassified. Methodology-lint allowlist is now at minimum debt.          | Executor          |

## Out of Scope

- Translating any Arabic content outside the three referenced directories.
- Creating Arabic-language archives or parallel copies.
- Modifying Spec #059's source code or seed allowlist generator.

## Estimated Effort

- Phase 0: completed (clarifications) + wait time for Spec #058 AND #059 merges.
- Phase 1 (project-analysis correction): 15 min.
- Phase 2 (analysis-2026-06-10/, 13 files): 1.5–2 hours of focused translation.
- Phase 3 (analysis-2026-06-23/, 14 files): 1.5–2 hours of focused translation.
- Phase 4 (evidence + docs): 30 min.
- Phase 5 (verification): 30 min.
- Phase 6 (review + merge): variable.
- Phase 7 (post-merge admin): 15 min.

Total focused execution: ~4–5 hours.
Total calendar time: depends on #058 and #059 merge schedules.
