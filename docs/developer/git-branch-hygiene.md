# Git Branch Hygiene

This document records the current branch inventory policy for Tempot. It exists
to prevent stale feature branches and old worktrees from being mistaken for
active delivery work.

## Current Inventory - 2026-06-20

Immediately after the cleanup and before any new pull-request branch is pushed,
the remote branch set was:

- `origin/main`

The long-lived remote branch baseline is `origin/main`. Temporary pull-request
branches may exist while work is under review, but they must be deleted after
merge or closure.

There were no open GitHub pull requests at the time of this inventory.

The local Git branch set is intentionally limited to:

- `main` - local tracking branch for `origin/main`.
- `codex/branch-hygiene-status-docs` - current documentation branch for this
  inventory update.
- `codex/057-telegram-smoke` - pending branch for real Telegram webhook smoke
  evidence.
- `codex/docs-freshness-gate` - retained because its worktree contains
  uncommitted local changes and must not be deleted automatically.

The active registered worktrees are:

- `F:/Tempot` on `codex/branch-hygiene-status-docs`.
- `F:/Tempot_Worktrees/057-telegram-smoke` on `codex/057-telegram-smoke`.
- `F:/Tempot_Worktrees/docs-freshness-gate` on
  `codex/docs-freshness-gate`.

Older directories may remain under `F:/Tempot_Worktrees` as filesystem-only
remainders from Windows `node_modules` deletion locks. They are not Git
branches or registered Git worktrees if `git worktree list` does not show them
and they do not contain a `.git` file.

## Branches Removed From GitHub

The 2026-06-20 cleanup removed obsolete remote branches after verifying that
they were merged, superseded, or closed and unsafe to reuse:

- `codex/057-production-delivery-hardening`
- `codex/057-runtime-artifact-hardening`
- `codex/architecture-saas-readiness-plan`
- `codex/bot-interaction-observability`
- `codex/bot-management-lifecycle-hardening`
- `codex/bot-management-production`
- `codex/bot-management-ux-helpers-reference`
- `codex/docker-build-log-cleanup`
- `codex/docker-prisma-deploy-cli`
- `codex/fix-callback-navigation-state`
- `codex/fix-ci-failures`
- `codex/fix-docker-base-vulnerabilities`
- `codex/fix-docker-trivy-action`
- `codex/fix-module-flow-navigation`
- `codex/fix-settings-callback-menu-error`
- `codex/fix-settings-regional-submenu`
- `codex/input-engine-inline-flow-standard`
- `codex/project-audit-2026-06-07`
- `codex/system-hardening`
- `codex/update-actual-project-status-docs`
- `codex/upgrade-node22-astro6`
- `docs/code-review-2025-05-18`
- `feature/019-module-registry-package`
- `feature/020-bot-server`
- `feature/025-user-management`

## Local Branches Removed

Local branches were reduced to the current inventory above. Merged local
branches were deleted with `git branch -d`. Old branches whose equivalent work
was merged by pull request, superseded by later `main` commits, or closed
without merge were deleted with `git branch -D` after review.

## Policy

- Delete a remote feature branch after its pull request is merged.
- Do not reuse old branches for new work. Create a fresh `codex/*` branch from
  `origin/main`.
- Before deleting a local branch, verify whether it is checked out in a
  worktree with `git worktree list`.
- Do not delete a dirty worktree. Resolve, commit, stash, or explicitly archive
  its changes first.
- Treat GitHub `origin/main` plus merged pull requests as the source of truth,
  not stale local branch names.
