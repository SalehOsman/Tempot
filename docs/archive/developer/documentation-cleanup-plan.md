# Documentation Cleanup Plan

**Status:** Active documentation maintenance plan.
**Scope:** `docs/` and root documentation files only.
**Last updated:** 2026-04-29.

## Goal

Make Tempot documentation reflect the actual project state without treating old
execution artifacts as current instructions.

## Phase 1: Entry Points and Source-of-Truth Cleanup

| Target                                     | Action                                                           | Status      |
| ------------------------------------------ | ---------------------------------------------------------------- | ----------- |
| `README.md`                                | Replace stale root overview with a current, concise entry point. | In progress |
| `CONTRIBUTING.md`                          | Remove corrupted symbols and align workflow with current rules.  | In progress |
| `GEMINI.md`                                | Keep as a thin Gemini-specific pointer to `CLAUDE.md`.           | In progress |
| `SECURITY.md`                              | Remove corrupted symbols and link current security baseline.     | In progress |
| `docs/README.md`                           | Add canonical documentation map.                                 | In progress |
| `docs/development/README.md`               | Add development documentation entry point.                       | In progress |
| `docs/product/README.md`                   | Add product/reference documentation entry point.                 | In progress |
| `docs/archive/README.md`                   | Clarify active compatibility files versus historical archive.    | In progress |
| `docs/archive/developer/workflow-guide.md` | Rebuild clean English workflow guide.                            | In progress |

## Phase 2: AI Documentation Reconciliation

| Target               | Action                                                                   | Status   |
| -------------------- | ------------------------------------------------------------------------ | -------- |
| ADR-016              | Align provider switch variable with `TEMPOT_AI_PROVIDER`.                | Complete |
| ADR-031              | Align provider switch wording with `TEMPOT_AI_PROVIDER`.                 | Complete |
| Architecture spec    | Replace active provider-variable references with `TEMPOT_AI_PROVIDER`.   | Complete |
| Package README files | Review separately because this phase is scoped to root docs and `docs/`. | Deferred |

## Phase 3: Archive Hygiene

Historical Superpowers plans and old readiness notes may contain old paths,
old Node baselines, or superseded examples. Do not rewrite them for style only.
Instead:

- Mark the archive policy clearly.
- Fix broken references only when they affect active workflows.
- Prefer new active guide pages over editing historical execution logs.

## Phase 4: Automated Documentation Checks

Recommended future checks:

- Broken internal Markdown links.
- Stale active-path references to removed documentation directories.
- Deprecated active environment variable names.
- Mojibake markers in active docs.
- Generated API reference drift.

These checks should exclude historical archive snapshots unless the file is
listed as an active source of truth.

## Out of Scope for This Phase

- TypeScript source changes.
- SpecKit artifact rewrites.
- Package README rewrites outside the repository root.
- Generated TypeDoc reference edits.
- Historical Superpowers plan rewrites.
