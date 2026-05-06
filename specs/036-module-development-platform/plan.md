# Implementation Plan: Module Development Platform

## Scope

Create documentation artifacts that establish a professional module development
platform for Tempot. The work is documentation-only and does not introduce code,
runtime behavior, or new dependencies.

## Artifacts

- `docs/archive/developer/module-development-catalog.md`
- `docs/archive/developer/new-module-checklist.md`
- `docs/archive/developer/module-generator-plan.md`
- `docs/archive/developer/module-boundary-guide.md`
- `docs/archive/developer/workflow-guide.md`
- `docs/archive/ROADMAP.md`
- `specs/036-module-development-platform/spec.md`
- `specs/036-module-development-platform/plan.md`
- `specs/036-module-development-platform/research.md`
- `specs/036-module-development-platform/data-model.md`
- `specs/036-module-development-platform/tasks.md`

## Design

The catalog is the central source. Existing developer documents link to it and
retain their focused purpose:

- `new-module-checklist.md` remains the checklist.
- `module-boundary-guide.md` remains the boundary reference.
- `module-generator-plan.md` remains the generator direction.
- `workflow-guide.md` remains the full project workflow.

## Validation Strategy

- Run `pnpm spec:validate` for SpecKit reconciliation.
- Run `git diff --check` for whitespace hygiene.
- Run `pnpm lint` only if documentation edits affect generated code or linted
  docs in future tooling.

## Risks

- Over-documenting future tooling can imply implementation. The catalog labels
  generator blueprints, Module Doctor, readiness scoring, and RAG assistant as
  future tooling unless separately specified.
- Removing experimental modules later can break tests if fixtures are not moved
  first. The catalog requires Roadmap, specs, tests, and tooling updates for any
  removal.
