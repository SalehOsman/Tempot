# Tempot Documentation Map

This directory contains the project documentation. Use this page as the entry
point instead of browsing `docs/archive/` directly.

## Active Documentation Areas

| Area               | Path                                             | Purpose                                                                      |
| ------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Product docs       | `docs/product/`                                  | User-facing and generated package reference docs.                            |
| Development docs   | `docs/development/`                              | Current contributor workflow, audits, retrospectives, and methodology notes. |
| Operational guides | `docs/guides/` and `docs/troubleshooting/`       | Focused guides for running and fixing the project.                           |
| Prompts            | `docs/prompt/`                                   | Human-reviewed prompt templates and review prompts.                          |
| AI context graph   | `.understand-anything/` and `docs/ONBOARDING.md` | Official AI onboarding aid and architecture relationship snapshot.           |
| Historical archive | `docs/archive/`                                  | Older architecture, ADR, planning, and execution artifacts.                  |

## Current Sources of Truth

| Topic                          | Source                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| Project status                 | `docs/ROADMAP.md`                                  |
| Constitution                   | `.specify/memory/constitution.md`                          |
| AI/tool role framework         | `.specify/memory/roles.md`                                 |
| Architecture specification     | `docs/architecture/tempot_architecture.md`                         |
| Development workflow           | `docs/developer/workflow-guide.md`                 |
| AI onboarding context          | `docs/ONBOARDING.md`                                       |
| Architecture knowledge graph   | `docs/developer/project-knowledge-graph.md`        |
| Documentation restructure plan | `docs/developer/documentation-restructure-plan.md` |
| Package checklist              | `docs/developer/package-creation-checklist.md`     |
| ADR index                      | `docs/architecture/adr/README.md`                  |
| Security baseline              | `docs/security/security-baseline.md`               |

## Archive Policy

`docs/archive/` contains historical records and compatibility pointers for
documents that moved to canonical `docs/` locations. Treat the files listed
above as active sources of truth. Treat old Superpowers plans, old project
readiness notes, and pre-methodology execution artifacts as historical unless
another active document explicitly references them as current.

## Documentation Quality Rules

- Developer-facing documentation is written in English.
- Links must point to real repository paths.
- The Understand Anything knowledge graph is an official AI context aid, not a
  higher authority than the constitution, SpecKit artifacts, roadmap, ADRs, or
  source code.
- Regenerate the knowledge graph after broad package, module, SpecKit,
  architecture, or documentation structure changes.
- Current documentation must not reference removed package names, old tool names,
  or deprecated environment variables as active guidance.
- Historical documents may preserve older context, but they must not be used as
  current implementation instructions unless marked active.
- Avoid duplicating long rules. Link to the constitution, roadmap, or workflow
  guide instead.

## Useful Commands

```bash
pnpm spec:validate
pnpm cms:check
pnpm lint
pnpm build
```

Documentation-only changes usually do not require the full integration test
suite, but broad documentation changes should still run `pnpm spec:validate`
because Tempot treats code-documentation parity as a project gate.
