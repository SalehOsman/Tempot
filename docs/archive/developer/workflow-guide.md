# Tempot Workflow Guide

> Constitutional reference: Rules LXXIX-LXXXIX in
> `.specify/memory/constitution.md`.
>
> Last reviewed: 2026-04-29.

This is the practical workflow guide for Tempot. SpecKit defines what and why.
Superpowers defines how the approved work is executed and verified.

## Required First Step

Every AI agent must read these files before acting:

1. `AGENTS.md`
2. `.specify/memory/roles.md`
3. `.specify/memory/constitution.md`

The active role is Technical Advisor unless the Project Manager explicitly gives
an Executor prompt or grants direct editing permission.

## Source Documents

| Topic             | Source                                                 |
| ----------------- | ------------------------------------------------------ |
| Role framework    | `.specify/memory/roles.md`                             |
| Constitution      | `.specify/memory/constitution.md`                      |
| Roadmap           | `docs/archive/ROADMAP.md`                              |
| Architecture spec | `docs/archive/tempot_v11_final.md`                     |
| Package checklist | `docs/archive/developer/package-creation-checklist.md` |
| Module checklist  | `docs/archive/developer/new-module-checklist.md`       |
| ADR index         | `docs/archive/architecture/adr/README.md`              |

## SpecKit Phase

SpecKit creates feature artifacts under `specs/{NNN}-{feature-name}/`.

| Step      | Command or skill                            | Output                                    |
| --------- | ------------------------------------------- | ----------------------------------------- |
| Specify   | `/speckit.specify` or `speckit-specify`     | `spec.md`                                 |
| Clarify   | `/speckit.clarify` or `speckit-clarify`     | clarified `spec.md`                       |
| Plan      | `/speckit.plan` or `speckit-plan`           | `plan.md`, `research.md`, `data-model.md` |
| Checklist | `/speckit.checklist` or `speckit-checklist` | `checklists/*.md`                         |
| Analyze   | `/speckit.analyze` or `speckit-analyze`     | consistency report                        |
| Tasks     | `/speckit.tasks` or `speckit-tasks`         | `tasks.md`                                |

When using numbered spec directories, set:

```powershell
$env:SPECIFY_FEATURE = "{NNN}-{feature-name}"
```

## Handoff Gate

Superpowers execution starts only when all required artifacts exist:

- `spec.md` with no `[NEEDS CLARIFICATION]`.
- `plan.md`.
- `tasks.md`.
- `research.md`.
- `data-model.md`.
- `speckit-analyze` has no critical finding.
- `pnpm spec:validate` has no critical finding, except for packages explicitly
  deferred by Rule XC in the roadmap.

## Superpowers Phase

| Step       | Skill                                                               | Purpose                                   |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------- |
| Design     | `brainstorming`                                                     | Validate and deepen the design.           |
| Isolation  | `using-git-worktrees`                                               | Create an isolated branch or worktree.    |
| Plan       | `writing-plans`                                                     | Convert tasks into small execution steps. |
| Execute    | `subagent-driven-development` on Codex, `executing-plans` elsewhere | Implement with TDD.                       |
| Review     | `requesting-code-review`                                            | Review against spec and constitution.     |
| Fix review | `receiving-code-review`                                             | Process findings rigorously.              |
| Verify     | `verification-before-completion`                                    | Prove gates with fresh command output.    |
| Finish     | `finishing-a-development-branch`                                    | Merge, PR, or cleanup decision.           |

Tempot does not use `/speckit.implement` for production execution.

## Documentation Sync

Rule L requires bidirectional code-documentation parity. Before completion,
review whether the change affects:

- SpecKit artifacts.
- `docs/archive/ROADMAP.md`.
- ADR files or ADR index.
- Architecture docs.
- Package or module README files.
- Root AI context files such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Changesets.

Documentation-only changes must still be validated against current code and
roadmap state.

## Common Gates

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm audit --audit-level=high
```

Run the subset that matches the change while developing. Run the full relevant
set before merge.

## Deferred Packages

Rule XC allows formally deferred packages to have incomplete reconciliation
until the roadmap activates them. Once activated, the package immediately follows
the full SpecKit and Superpowers workflow.

As of the current roadmap, `notifier` has been activated. The remaining deferred
packages are:

- `cms-engine`
- `search-engine`
- `document-engine`
- `import-engine`

## Hotfix Track

Use the hotfix track only for P0/P1 production bugs:

1. Document the issue.
2. Add or update the minimum failing test.
3. Fix the root cause.
4. Verify the fix.
5. Update affected docs within the allowed hotfix window.

Hotfixes do not waive the Result pattern, i18n, repository, or clean-diff rules.
