---
name: tempot-superpowers-toolchain
description: Use Superpowers professionally inside Tempot for execution after SpecKit handoff, including brainstorming, worktrees, writing plans, TDD, subagent-driven or local execution, code review, verification, finishing branches, and systematic debugging. Use when turning Tempot tasks.md into working code or docs, fixing bugs, validating completion, or merging implementation branches.
---

# Tempot Superpowers Toolchain

## Overview

Use this skill when execution begins after Spec Kit has defined the work. Superpowers turns Tempot plans into verified changes through design review, TDD, implementation, review, and completion gates.

## Required Sources

Read only the sources needed for the task:

- Official Superpowers repository: `https://github.com/obra/superpowers`
- Local Superpowers skills in `C:\Users\saleh\.codex\superpowers\skills\`
- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- `docs/archive/developer/workflow-guide.md`
- The active `specs/{NNN}-{feature}/spec.md`, `plan.md`, and `tasks.md`

## Execution Flow

Use this sequence after the Spec Kit handoff gate passes:

1. `brainstorming`: validate intent, risks, and design choices against the artifacts.
2. `using-git-worktrees`: isolate feature work unless the Project Manager explicitly permits direct work.
3. `writing-plans`: convert `tasks.md` into short executable checkpoints.
4. `subagent-driven-development`: use only when platform policy and user authorization allow subagents; otherwise execute locally with the same checkpoints.
5. `requesting-code-review`: review against the spec, constitution, and actual diff.
6. `receiving-code-review`: process findings with technical verification.
7. `verification-before-completion`: prove commands pass before claiming completion.
8. `finishing-a-development-branch`: decide merge, PR, cleanup, or follow-up.

## Bugfix Flow

For failures, use `systematic-debugging`:

1. Reproduce the failure.
2. Trace the root cause.
3. Add or identify a failing test when code behavior changes.
4. Fix at the source.
5. Run the smallest relevant test first, then broader gates.
6. Document residual risk if a gate cannot run.

## TDD Rules

- Production behavior changes require RED -> GREEN -> REFACTOR.
- Do not write production code before the failing test unless the task is documentation-only or configuration-only.
- For documentation-only or CI-only changes, use validation commands as the proof gate.
- Do not bypass lint, type, or test failures with ignores, wrappers, or unrelated refactors.

## Delegation Rules

- Use subagents only when the user or platform explicitly allows delegation or parallel agent work.
- Split delegated work by disjoint file ownership.
- Keep blocking tasks local when the next step depends on the result.
- Review returned changes before merging them into the main working tree.

## Verification Output

Before reporting work as complete, include:

- Commands run.
- Exit status or concise result.
- Test counts or relevant failure lines.
- Files changed.
- Any skipped gate and the reason.

Never claim that code is fixed, merged, or ready without fresh verification evidence.

## Completion Rules

- Do not merge or push with failing required gates.
- Keep commits scoped to one concern.
- Sync affected documentation before finishing.
- Use `finishing-a-development-branch` for merge and cleanup decisions when a branch or worktree is involved.
