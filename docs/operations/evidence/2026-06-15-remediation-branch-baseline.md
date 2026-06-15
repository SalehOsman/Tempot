# Remediation Branch Baseline

**Captured:** 2026-06-15  
**Purpose:** Preserve the repository state used to begin remediation sequence
reconciliation.

## Branch State

| Worktree or branch                    | Head                  | State                                                                              | Permitted action                                   |
| ------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| `main`                                | `8611dd1`             | Merged baseline including the 2026-06-11 and 2026-06-12 Spec 056 CI fixture slices | Read-only source baseline                          |
| `codex/053-authorization-correction`  | `4b45f71`             | Committed and not merged to current `main`                                         | Review and reconcile                               |
| `codex/056-quality-gates-hardening`   | `e4c456f`             | Committed and not merged to current `main`                                         | Review and reconcile                               |
| `codex/remediation-integration`       | `67950ff`             | Committed integration of Specs 053 and 056; merge base predates current `main`     | Merge source for Stage 1                           |
| `codex/054-sensitive-data-protection` | `e9624a8`             | Dirty worktree with 40 modified files and 14 untracked files                       | Preserve; no edits, reset, clean, rebase, or merge |
| Spec 055                              | No branch or worktree | Specification artifacts only                                                       | Start only after Stage 1 closes                    |

## Worktree Paths

| Branch                    | Path                                                      |
| ------------------------- | --------------------------------------------------------- |
| Current baseline checkout | `F:\Tempot`                                               |
| Spec 053                  | `F:\Tempot_Worktrees\053-authorization-correction`        |
| Spec 054                  | `F:\Tempot_Worktrees\054-sensitive-data-protection`       |
| Spec 056                  | `F:\Tempot_Worktrees\056-quality-gates-hardening`         |
| Existing integration      | `F:\Tempot_Worktrees\remediation-integration`             |
| Sequence reconciliation   | `F:\Tempot_Worktrees\remediation-sequence-reconciliation` |

## Protection Constraint

Stage 0 and Stage 1 commands must not run with
`F:\Tempot_Worktrees\054-sensitive-data-protection` as their working directory,
except for read-only status inspection. The 54 existing changes in that
worktree are treated as Project Manager work that must remain intact.

## Reconciliation Dependency

The Stage 1 target is current `main` plus the committed
`codex/remediation-integration` history. Conflict resolution must retain:

- the latest current-main bot-server integration fixtures;
- the committed Spec 053 authorization behavior and tests;
- the committed Spec 056 gate implementations that are not already present on
  `main`;
- truthful documentation states that distinguish merged, verified on branch,
  in progress, and not started work.
