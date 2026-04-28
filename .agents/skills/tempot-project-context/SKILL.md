---
name: tempot-project-context
description: Establish authoritative Tempot project context before analysis, planning, implementation, review, merge, or documentation work. Use when an agent starts work in the Tempot repository, receives a broad project request, needs to understand roles, governance, roadmap state, architecture boundaries, or must decide which project rules apply before acting.
---

# Tempot Project Context

## Overview

Use this skill to orient any agent before working in Tempot. Treat it as the project entry gate: load authority documents, identify the active workflow role, and derive the minimum context needed for the task.

## Context Gate

Before taking action, read these files in order:

1. `AGENTS.md`
2. `.specify/memory/roles.md`
3. `.specify/memory/constitution.md`

Then read only task-relevant documents:

- Project status: `docs/archive/ROADMAP.md`
- Architecture: `docs/archive/tempot_v11_final.md`
- Workflow: `docs/archive/developer/workflow-guide.md`
- Package checklist: `docs/archive/developer/package-creation-checklist.md`
- Active feature: `.specify/feature.json` and the matching `specs/{NNN}-{feature}/`

## Role Handling

Respect `.specify/memory/roles.md`.

- If the current message grants explicit permission to edit files, proceed within that scope.
- If permission is not explicit, act as Technical Advisor: analyze, plan, and write executor-ready instructions instead of editing.
- Never bypass the Project Manager to communicate with a separate Executor.
- Always prefer the newest user instruction when it conflicts with earlier context.

## Project Identity

Tempot is an enterprise Telegram bot framework built as a strict TypeScript monorepo. The architecture separates:

- `apps/`: interfaces such as bot server and docs
- `packages/`: reusable services and infrastructure
- `modules/`: business logic and domain modules
- `specs/`: SpecKit source of truth
- `docs/archive/`: architecture, roadmap, developer, and governance documentation

## Operating Rules

Use the constitution as non-negotiable authority. Especially check:

- No direct work on `main` unless the Project Manager explicitly authorizes it.
- TDD is mandatory for production behavior changes.
- Code and docs must stay synchronized.
- User-facing text must come from i18n keys.
- Public fallible APIs return `Result<T, AppError>`.
- Services do not bypass repositories for database access.
- Modules communicate through the event bus.

## Context Output

When reporting back, state the active role, the relevant source documents read, the current branch/status, and any constraints that affect the next action.
