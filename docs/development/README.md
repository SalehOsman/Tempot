# Tempot Development Documentation

This area contains current development guidance. Active documents live in
canonical `docs/` locations. Legacy `docs/archive/...` paths are retained as
compatibility pointers for historical SpecKit artifacts, plans, and older AI
agent context.

## Start Here

1. Read `.specify/memory/roles.md`.
2. Read `.specify/memory/constitution.md`.
3. Read `docs/developer/workflow-guide.md`.
4. Check `docs/ROADMAP.md` for the active phase.
5. Use the relevant package or module checklist before editing code.
6. Use `docs/ONBOARDING.md` and the Understand Anything graph for fast project
   context before deeper source review.

## Current Guides

| Guide                          | Path                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| Workflow guide                 | `docs/developer/workflow-guide.md`                 |
| Package checklist              | `docs/developer/package-creation-checklist.md`     |
| Module checklist               | `docs/developer/new-module-checklist.md`           |
| Module boundary guide          | `docs/developer/module-boundary-guide.md`          |
| Agent skills guide             | `docs/developer/agent-skills-guide.md`             |
| Local developer doctor         | `docs/developer/local-developer-doctor.md`         |
| First module quick path        | `docs/developer/quick-path-first-module.md`        |
| Project knowledge graph        | `docs/developer/project-knowledge-graph.md`        |
| Understand Anything workflow   | `docs/developer/understand-anything-workflow.md`   |
| Documentation restructure plan | `docs/developer/documentation-restructure-plan.md` |
| Documentation checks           | `docs/development/documentation-quality-checks.md`         |

## Quality Gates

Use these gates according to change scope:

| Gate                | Command                         |
| ------------------- | ------------------------------- |
| Lint                | `pnpm lint`                     |
| Build               | `pnpm build`                    |
| Unit tests          | `pnpm test:unit`                |
| Integration tests   | `pnpm test:integration`         |
| Spec reconciliation | `pnpm spec:validate`            |
| i18n completeness   | `pnpm cms:check`                |
| Security audit      | `pnpm audit --audit-level=high` |
| Boundary audit      | `pnpm boundary:audit`           |
| Module checklist    | `pnpm module:checklist`         |

## Documentation Work

Documentation changes must preserve code-documentation parity:

- Update root context files when the current phase, workflow, or toolchain
  changes.
- Update `docs/ROADMAP.md` after merge-relevant progress changes.
- Update ADR indexes when an ADR is added or superseded.
- Keep historical files stable unless a cleanup task explicitly targets them.
- Do not edit generated API reference pages by hand.
- Keep the AI context graph synchronized when broad architecture, package,
  module, or documentation structure changes are merged.
