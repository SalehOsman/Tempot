---
name: tempot-methodology-workflow
description: Apply Tempot's SpecKit plus Superpowers methodology for feature specification, planning, task generation, implementation, review, validation, and merge decisions. Use when creating or updating specs, planning work, converting tasks into execution, fixing methodology drift, or deciding which gates must pass before code or docs move forward.
---

# Tempot Methodology Workflow

## Overview

Use this skill to keep Tempot work inside the approved delivery process. SpecKit defines what and why; Superpowers defines how to execute and verify.

## Required Sources

Read:

- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- `docs/archive/developer/workflow-guide.md`
- `.specify/feature.json` when an active feature exists
- `specs/{NNN}-{feature}/spec.md`
- `specs/{NNN}-{feature}/plan.md`
- `specs/{NNN}-{feature}/tasks.md`
- `specs/{NNN}-{feature}/research.md`
- `specs/{NNN}-{feature}/data-model.md`

## Workflow

Use this sequence unless the Project Manager explicitly narrows the task:

1. Confirm project role and permission to edit.
2. Confirm whether the task is specification, implementation, bugfix, review, or merge.
3. Locate the active spec directory.
4. Validate required artifacts exist before execution.
5. Run or report the required gates:
   - `/speckit.analyze` for artifact consistency
   - `pnpm spec:validate` for spec-to-code reconciliation
   - task-specific tests
6. Use Superpowers execution only after the SpecKit handoff gate passes.

## Execution Rules

- Do not use `/speckit.implement` for Tempot execution. Superpowers handles execution.
- Do not implement production behavior without TDD.
- Do not continue past failed gates. Diagnose and fix first.
- Do not treat deferred packages as active unless the roadmap activates them.
- Do not update docs without validating code/doc alignment.

## Branch Rules

Default to a feature branch or worktree. Direct work on `main` requires explicit Project Manager permission in the same request.

## Documentation Sync

For every change, identify affected documentation:

- SpecKit artifacts
- `docs/archive/ROADMAP.md`
- ADR index and new ADRs
- architecture docs
- package or module README files
- changesets when release behavior changes

Report any skipped documentation artifact and the reason.
