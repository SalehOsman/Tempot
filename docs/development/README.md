# Tempot Development Documentation

This area contains current development guidance. Some canonical documents still
live under `docs/archive/` because their paths are referenced by the
constitution, SpecKit artifacts, and AI agent context files.

## Start Here

1. Read `.specify/memory/roles.md`.
2. Read `.specify/memory/constitution.md`.
3. Read `docs/archive/developer/workflow-guide.md`.
4. Check `docs/archive/ROADMAP.md` for the active phase.
5. Use the relevant package or module checklist before editing code.

## Current Guides

| Guide                   | Path                                                   |
| ----------------------- | ------------------------------------------------------ |
| Workflow guide          | `docs/archive/developer/workflow-guide.md`             |
| Package checklist       | `docs/archive/developer/package-creation-checklist.md` |
| Module checklist        | `docs/archive/developer/new-module-checklist.md`       |
| Module boundary guide   | `docs/archive/developer/module-boundary-guide.md`      |
| Agent skills guide      | `docs/archive/developer/agent-skills-guide.md`         |
| Local developer doctor  | `docs/archive/developer/local-developer-doctor.md`     |
| First module quick path | `docs/archive/developer/quick-path-first-module.md`    |
| Documentation checks    | `docs/development/documentation-quality-checks.md`     |

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
- Update `docs/archive/ROADMAP.md` after merge-relevant progress changes.
- Update ADR indexes when an ADR is added or superseded.
- Keep historical files stable unless a cleanup task explicitly targets them.
- Do not edit generated API reference pages by hand.
