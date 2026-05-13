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

| Topic             | Source                                         |
| ----------------- | ---------------------------------------------- |
| Role framework    | `.specify/memory/roles.md`                     |
| Constitution      | `.specify/memory/constitution.md`              |
| Roadmap           | `docs/ROADMAP.md`                              |
| Architecture spec | `docs/architecture/tempot_architecture.md`     |
| Package checklist | `docs/developer/package-creation-checklist.md` |
| Module checklist  | `docs/developer/new-module-checklist.md`       |
| Module catalog    | `docs/developer/module-development-catalog.md` |
| ADR index         | `docs/architecture/adr/README.md`              |

## Product Identity Guardrail

Tempot Core is currently a production-grade Telegram bot framework and
single-bot starter template. Every developer change should preserve that
practical goal: a user can configure, extend, test, and deploy one Telegram bot
without rebuilding the common platform capabilities.

At the same time, Tempot Core must remain SaaS-ready. Developers must avoid
design choices that hard-code a permanent single-bot future when a clean
bot-scope boundary is already available. The rule is:

1. Optimize the current implementation for the single-bot template experience.
2. Keep contracts, settings, audit metadata, module enablement, and runtime
   boundaries ready for future multi-bot management.
3. Do not implement tenant, billing, dashboard, marketplace, or managed fleet
   behavior unless a dedicated future spec explicitly activates it.

`bot-management` should therefore be treated as a lightweight current registry
and a future SaaS bridge, not as the center of the current product.

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
- `docs/ROADMAP.md`.
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

## Local Bot Development Runtime

Use the workspace bot development runtime when changing bot-server code, active
runtime packages, or active Telegram modules:

```bash
pnpm dev:bot
```

The command first builds the active bot runtime packages and modules, then runs
their TypeScript compilers in watch mode alongside `bot-server`. Module and
package `dist` changes are included in the bot-server watcher, so source edits
are compiled and then trigger a bot restart automatically.

Use `pnpm --filter bot-server dev` only when changing bot-server code that does
not depend on updated workspace package or module output.

## Deferred Packages

Rule XC allows formally deferred packages to have incomplete reconciliation
until the roadmap activates them. Once activated, the package immediately follows
the full SpecKit and Superpowers workflow.

As of the current roadmap, no package remains deferred under Rule XC.

## Hotfix Track

Use the hotfix track only for P0/P1 production bugs:

1. Document the issue.
2. Add or update the minimum failing test.
3. Fix the root cause.
4. Verify the fix.
5. Update affected docs within the allowed hotfix window.

Hotfixes do not waive the Result pattern, i18n, repository, or clean-diff rules.
