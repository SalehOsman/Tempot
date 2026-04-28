---
name: tempot-spec-kit-toolchain
description: Use GitHub Spec Kit professionally inside Tempot for specification-driven development, including specify, clarify, plan, checklist, analyze, tasks, feature detection, artifact validation, and handoff to Superpowers. Use when creating, updating, validating, or repairing Tempot SpecKit artifacts under specs/.
---

# Tempot Spec Kit Toolchain

## Overview

Use this skill when working with Spec Kit artifacts in Tempot. Spec Kit defines what and why; it does not execute implementation in this project.

## Required Sources

Read only the sources needed for the task:

- Official Spec Kit repository: `https://github.com/github/spec-kit`
- `.agents/skills/speckit-*/SKILL.md` for the local command behavior
- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- `.specify/feature.json` when detecting the active feature
- `docs/archive/developer/workflow-guide.md`
- The active `specs/{NNN}-{feature}/` artifacts

## Tempot Command Flow

Use this order for new or changing features:

1. `/speckit.specify` creates or updates `spec.md`.
2. `/speckit.clarify` resolves ambiguity and removes `[NEEDS CLARIFICATION]`.
3. `/speckit.plan` creates or updates `plan.md`, `research.md`, and `data-model.md`.
4. `/speckit.checklist` creates focused quality checklists when useful.
5. `/speckit.tasks` creates dependency-ordered `tasks.md`.
6. `/speckit.analyze` checks artifact consistency.
7. `pnpm spec:validate` checks repository reconciliation.

Do not use `/speckit.implement` in Tempot. Superpowers handles execution after the handoff gate.

## Feature Detection

- Prefer the active feature recorded by Spec Kit tooling.
- If running from `main` or detection fails, set `$env:SPECIFY_FEATURE = "{NNN}-{feature-name}"` before command execution.
- Never create artifacts in an unnumbered or guessed directory.
- Keep one feature concern per spec directory.

## Artifact Responsibilities

- `spec.md`: user value, acceptance criteria, scenarios, edge cases, and constraints. No implementation stack.
- `plan.md`: technical approach, architecture impact, constitution checks, and execution strategy.
- `research.md`: decisions, alternatives, and rejected approaches.
- `data-model.md`: entities, state, relationships, contracts, and migrations when relevant.
- `tasks.md`: ordered, testable implementation tasks with clear dependencies.
- `checklists/*.md`: focused review criteria for requirements, risks, or domain rules.

## Handoff Gate

Before implementation starts, confirm:

- `spec.md`, `plan.md`, `tasks.md`, `research.md`, and `data-model.md` exist.
- No `[NEEDS CLARIFICATION]` markers remain.
- `/speckit.analyze` has no critical inconsistency.
- `pnpm spec:validate` reports zero critical issues.
- Deferred packages are treated according to Constitution Rule XC.

## Analysis Discipline

For analysis-only requests:

- Do not edit files.
- Report inconsistencies by artifact and line when possible.
- Separate missing artifacts, contradictory requirements, weak acceptance criteria, and constitution conflicts.
- Recommend the next Spec Kit command or exact artifact repair.

## Output Requirements

When finishing Spec Kit work, report:

- Active feature directory.
- Artifacts created or changed.
- Commands or local skills used.
- Validation status and unresolved risks.
