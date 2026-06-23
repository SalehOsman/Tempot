# Feature Specification: Methodology Lint Coverage

**Feature Branch**: `codex/059-methodology-lint-coverage` (to be created from `main` after Spec #058 merges; Rule LXXXV blocks parallel execution)
**Created**: 2026-06-23
**Status**: SPEC APPROVED (Specification phase complete on 2026-06-23). Execution blocked on Spec #058 merge per Rule LXXXV.
**Approved by**: Project Manager (`SalehOsman`), 2026-06-23.
**Executor (planned)**: AI Executor under Project Manager oversight (Three-Role Framework, `roles.md`).
**Input**: Audit gap discovered on 2026-06-23 while producing `docs/analysis-2026-06-23/`. Despite the constitution containing explicit rules (Rule XL Language Policy, Rule LXXVIII Clean Workspace, Rule I No Bypass), several rules are not enforced by any automated gate. The 2026-06-10 prior analysis (`docs/analysis-2026-06-10/`) and the 2026-06-23 analysis itself were written in Arabic, violating Rule XL undetected. This spec closes the enforcement gap by adding methodology lint audits to the existing CI gate chain.

## Goals

- Make Rule XL violations in `docs/**/*.md` and developer-facing files **automatically detectable** and **blocking** in CI.
- Make Rule LXXVIII violations (stale `.js` artifacts in `src/`, empty `utils/` folders) **automatically detectable**.
- Make Rule I violations (`eslint-disable` outside `tests/`, including in `scripts/`) **automatically detectable**.
- Provide a single local command `pnpm methodology:lint` that runs all methodology audits, so developers can verify compliance before pushing.
- Wire the aggregator into the existing `methodology` job in `.github/workflows/ci.yml` as a single step, without duplicating existing audits.

## Non-Goals

- Do **not** add new constitutional rules. This spec enforces **existing** rules only.
- Do **not** alter the content of existing rules; constitutional amendments are out of scope here.
- Do **not** replace existing audits (`boundary:audit`, `authorization:check`, `module:checklist`, `source:conformance`, `toolchain:audit`, `spec:validate`, `cms:check`, `docs:check`); the aggregator wraps them.
- Do **not** implement mutation testing, dependency upgrades, secrets scanning, or any change covered by another spec.
- Do **not** translate or delete existing Arabic documentation as part of this spec; that is tracked separately in Spec #061 (Arabic Docs Translation/Removal).
- Do **not** clean up the pre-existing violations (`apps/bot-server/src/bot-server.types.js`, `apps/bot-server/scripts/webhook-manager.ts:1-2`, empty `utils/` directories, Arabic comments in `.ts`); that is Spec #060 (Workspace Cleanup).
- Do **not** add branch-naming enforcement here; that is a future DX spec.

## Clarifications

### Session 2026-06-23 (Resolved)

All questions resolved by Project Manager on 2026-06-23 based on Technical Advisor analysis (Rule LXXXIV).

- **Q1 — Existing Arabic-language documents (`docs/analysis-2026-06-10/`, `docs/analysis-2026-06-23/`, `docs/project-analysis/2026-06-07/`):** Allowlist with **time-boxed entries**. Each allowlist entry MUST carry `added_at`, `expires_at` (≤ 90 days from added_at), and `owner_spec` (the spec that will resolve the debt). The audit prints a warning when an entry is within 14 days of expiration and **fails** when an entry is expired. The Arabic analysis folders are owned by Spec #061 (Arabic Docs Translation/Removal). Rationale: enforcement begins immediately for new content; existing debt becomes tracked, dated, and accountable rather than grandfathered.

- **Q2 — Branch / Rule LXXXV ordering:** Specification phase for Spec #059 completes now in parallel with Spec #058 execution (allowed by Rule LXXXV line 616). Execution phase for Spec #059 starts only after Spec #058 merges to `origin/main`. A fresh worktree `codex/059-methodology-lint-coverage` is created from `main` at that time. No parallel execution.

- **Q3 — Audit surface coverage:** All developer-facing surfaces (Option A): `docs/**/*.md`, `apps/**/*.ts`, `packages/**/*.ts`, `modules/**/*.ts`, `scripts/**/*.ts`, `.specify/**/*.md`, root `*.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Rationale: Rule XL text covers "code, comments, docs, ADRs, variables, README, SpecKit files" without exception.

- **Q4 — `tests/**` policy:** String literals inside `*.test.ts`, `*.spec.ts`, and files under `**/tests/__fixtures__/**` are exempt from the Arabic Unicode check; comments and `describe`/`it` descriptions remain in English (Rule XXXVII). Rationale: fixtures testing Arabic input handling are functional, not communicative; test descriptions are developer-facing.

- **Q5 — `stale-artifacts-audit` scope:** `utils/` directories only in v1 (Option A). Empty `events/`, `commands/`, `menus/`, `features/` directories are not flagged because they may serve as deliberate scaffolding for future extension. Rationale: narrow blast radius; widen later only with evidence.

- **Q6 — `branch-naming-audit`:** Deferred to a future DX spec (Option B). Rule IX (Single Responsibility per Change) favors narrow scope.

### Strategy Decision (Resolved)

Ship enforcement first with a time-boxed allowlist (Strategy A). Spec #060 (Workspace Cleanup) drains the allowlist incrementally by fixing the underlying violations and removing the corresponding allowlist entries. Spec #061 (Arabic Docs Translation/Removal) resolves the documentation allowlist entries. Rationale: blocking enforcement until cleanup is complete would extend the window during which the gap that caused this spec remains open.

### Constitution Amendment (Resolved)

This spec includes a Constitution Amendment to v2.6.0 (Rule LIII) that appends an Enforcement note to Rule XL pointing at `methodology-lint`'s `language-policy-audit`. The amendment is described in `plan.md` and executed as task T031. No new rule is created; only an Enforcement marker is added.

## User Scenarios & Testing

### User Story 1 — Block non-English content in developer docs (Priority: P0)

A maintainer opens a PR that adds `docs/analysis-2026-07-15/00-summary.md` containing Arabic prose. CI fails with a clear error pointing to the offending lines, blocking merge.

**Why this priority**: This is the root cause of the documented incident on 2026-06-23. Without this audit, Rule XL violations remain undetected.

**Independent Test**: Create a fixture `scripts/ci/tests/__fixtures__/language-policy/arabic-doc.md` containing Arabic Unicode block. Run `tsx scripts/ci/language-policy-audit.ts --fixture-root scripts/ci/tests/__fixtures__/language-policy`. Audit MUST exit with code 1 and print the file path and matched line numbers in deterministic `file:line:column` order. Then run against the production tree only; the audit MUST exit 0 (because the production tree's known violations are time-boxed in the allowlist).

**Acceptance Criteria**:

- Audit exits 1 when any code point in the Unicode block `U+0600–U+06FF` appears outside the allowlist or in a comment / `describe` / `it` description inside `**/tests/**`.
- String literals inside `*.test.ts`, `*.spec.ts`, and `**/tests/__fixtures__/**` are exempt from the Arabic check.
- Default allowed surfaces: all `**/locales/**`, all string literals in `**/tests/**` (per above).
- Time-boxed allowlist entries are honored until `expires_at`; after that, audit fails.
- Error output identifies file, line number, column, excerpt, rule reference (`Rule XL`), constitution citation (`.specify/memory/constitution.md:235`), and one-line fix suggestion.

### User Story 2 — Block stale `.js` artifacts inside `src/` (Priority: P0)

A maintainer accidentally checks in a transient `.js` file (e.g., from a misconfigured editor) inside `apps/bot-server/src/`. CI fails before merge.

**Why this priority**: A live incident exists (`apps/bot-server/src/bot-server.types.js`). Without enforcement, similar artifacts will recur.

**Independent Test**: Create `scripts/ci/tests/__fixtures__/stale-artifacts/sample-app/src/stale.js` and a separate fixture `scripts/ci/tests/__fixtures__/stale-artifacts/empty-utils-module/utils/`. Run the audit against the fixture root. Audit MUST exit 1 and identify both kinds of violations grouped by category. Then run against the production tree; the audit MUST exit 0 (pre-existing violations are time-boxed in the allowlist until resolved by Spec #060).

**Acceptance Criteria**:

- Audit exits 1 if any `*.js` file exists under `apps/*/src/`, `packages/*/src/`, or `modules/*/` (excluding `node_modules/`, `dist/`, generated `.d.ts.js`).
- Audit exits 1 if any `utils/` directory under `modules/*/` is empty (per Q5 default Option A).
- Error output groups violations by category (stale-js, empty-utils).

### User Story 3 — Block `eslint-disable` outside tests (Priority: P0)

A maintainer adds `/* eslint-disable no-console */` to a script under `apps/bot-server/scripts/`. CI fails.

**Why this priority**: Rule I is explicit but only enforced by ESLint inside files ESLint actually lints with no `eslint-disable` allowed; the loophole is using `eslint-disable` on the first line. This audit closes the loophole.

**Independent Test**: Create `scripts/ci/tests/__fixtures__/eslint-disable/disabled.ts` with `/* eslint-disable */` at the top. Run the audit against the fixture root. Audit MUST exit 1. Then create a sibling `tests/disabled.ts` with the same directive; audit MUST treat it as allowed (test exemption). Then run against the production tree; audit MUST exit 0 (the existing `webhook-manager.ts:1-2` is time-boxed in the allowlist, owner Spec #060).

**Acceptance Criteria**:

- Audit exits 1 if `eslint-disable`, `eslint-disable-next-line`, or `eslint-disable-line` appears outside `**/tests/**`.
- Optional exemption list documented in the audit source (currently empty).

### User Story 4 — Single aggregated local command (Priority: P1)

A developer about to push runs `pnpm methodology:lint`. The command runs every methodology audit in sequence, prints a concise PASS/FAIL summary per audit, and exits with a non-zero code if any audit failed.

**Why this priority**: Reduces CI iteration cycles and prevents pushes that the developer could have caught locally.

**Independent Test**: After running the command, confirm output lists each audit on its own line with PASS or FAIL, and the final exit code matches the worst result.

**Acceptance Criteria**:

- `pnpm methodology:lint` invokes the aggregator script.
- Aggregator returns 0 if all audits pass, non-zero (sum of failure flags) otherwise.
- Output format is stable for parsing in CI logs.

### User Story 5 — Aggregator runs as a single CI step (Priority: P1)

The `methodology` job in `.github/workflows/ci.yml` invokes the aggregator instead of listing every audit individually.

**Why this priority**: Keeps the CI config compact and makes adding new audits a one-line change in the aggregator.

**Acceptance Criteria**:

- The `methodology` job has one step `pnpm methodology:lint` that replaces the existing individual audit steps.
- Step output mirrors local output for parity.

## Out of Scope

- Translation or removal of existing Arabic documentation (Spec #061).
- Cleanup of the pre-existing violations themselves (Spec #060).
- Visualization or dashboard for methodology compliance beyond the JSON report artifact.
- IDE integration (ESLint plugin authoring) — covered by another future spec if needed.
- Branch-naming enforcement (deferred per Q6).

## Constraints

### Code constraints

- All audit scripts MUST be TypeScript, executable via `tsx`, and located in `scripts/ci/`.
- All audit scripts MUST follow Rule II (max-lines 200, max-lines-per-function 50, max-params 3).
- All audit scripts MUST exit 0 on success, 1 on legitimate violation, 2 on internal/tooling error (see `data-model.md`).
- All audit scripts MUST be deterministic: violations sorted by `file:line:column` ascending, output text identical across runs given identical inputs.
- All audit scripts MUST read-only the filesystem; they MUST NOT modify any file.
- All audit scripts MUST use only native `node:fs`/`node:path` plus existing devDependencies (no new dependency adds).

### Aggregator constraints

- The aggregator MUST be deterministic (audit order fixed and documented in `data-model.md`).
- The aggregator MUST run audits sequentially (not parallel) in v1 to keep output readable. Parallelism is a future optimization.
- The aggregator MUST support output formats: human (default), `--format=json`, `--format=sarif`.
- The aggregator MUST support `--quick` mode that runs only the fast audits (language-policy on staged files, stale-artifacts spot-check, eslint-disable on staged files) for the pre-commit hook. Quick mode MUST complete in ≤ 3 seconds.
- The aggregator MUST produce a CI artifact `methodology-lint-report.json` containing per-audit results, allowlist statistics (`total`, `expiring_soon`, `expired`), and total duration.

### Allowlist constraints

- The allowlist file is `scripts/ci/methodology-lint.allowlist.json`.
- Each entry MUST contain: `pattern` (glob), `reason` (≥ 20 characters), `added_at` (ISO 8601 date), `expires_at` (ISO 8601 date, ≤ `added_at` + 90 days), `owner_spec` (e.g., `060-workspace-cleanup`).
- The allowlist meta-linter MUST validate this shape at audit startup; entries missing required fields cause exit code 2.
- Patterns MUST match at least one real file at the time of validation; dangling entries cause exit code 2.
- The audit prints a warning when an entry is within 14 days of expiration and fails when an entry's `expires_at` is in the past.

### Test fixtures location

- All audit test fixtures live under `scripts/ci/tests/__fixtures__/<audit-name>/`.
- Fixtures MUST NOT live in the production tree (`apps/`, `packages/`, `modules/`) to prevent self-detection.
- Fixtures are excluded from `coverage` and `vitest` projects unless invoked explicitly via the audit's own tests.

### Performance constraints

- Each new audit (cold cache, full monorepo): ≤ 5 seconds.
- Aggregator overhead: ≤ 2 seconds beyond the sum of audit durations.
- Net change to `methodology` CI job runtime: ≤ +30 seconds.
- A performance regression test asserts the aggregator completes in ≤ 30 seconds.

### Educational error messages

- Every violation MUST include: rule reference (`Rule XL`), constitution line citation (`.specify/memory/constitution.md:235`), one-line fix suggestion, optional excerpt (≤ 120 chars).
- Output line format is documented in `data-model.md` and locked by tests.

## Success Metrics

- Zero non-English files in `docs/` once Spec #061 drains the language-policy allowlist entries.
- Zero `.js` files in `src/` once Spec #060 drains the stale-artifacts allowlist entries.
- Zero `eslint-disable` directives outside `tests/` once Spec #060 drains the eslint-disable allowlist entries.
- Zero empty `utils/` directories under `modules/` once Spec #060 cleanup completes.
- Allowlist contains zero expired entries at any time on `main`.
- CI fails on any new violation submitted via PR (proven by a one-off probe PR after this spec merges).
- Aggregator total runtime in `methodology` job is within +30 seconds of pre-spec baseline.

## Dependencies

- **Blocks**: Spec #060 (Workspace Cleanup) once audits are shipped — cleanup work removes the corresponding allowlist entries one by one.
- **Blocks**: Spec #061 (Arabic Docs Translation/Removal) once audits are shipped — documentation work removes its allowlist entries.
- **Blocked by**: Spec #058 (Bot Access Mode Membership Gate) merge to `origin/main`, per Rule LXXXV (Single Active Spec in execution).
- **Methodology constraint**: Rule LXXXV permits parallel specification, blocks parallel execution. This spec is fully specified now; execution waits.

## Risks

| Risk                                                                                          | Mitigation                                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| False positives on Arabic content in test fixtures.                                            | Token-scanner distinguishes string literals from comments inside `**/tests/**` (Q4 resolution).             |
| Audit performance bloat increases CI time noticeably.                                          | Performance budget in Constraints; regression test in `methodology-lint.test.ts`.                           |
| Confusion about which audit caught a violation.                                                | Aggregator output namespaced by audit identifier; rule reference and constitution citation printed.         |
| Allowlist entries become permanent grandfathering.                                              | Time-boxed entries (max 90 days); meta-linter fails on expired entries; warning at 14 days before expiration. |
| Spec #060 / #061 delayed past allowlist `expires_at`, blocking CI.                              | Project Manager tracks owner_spec progress; renewal requires explicit commit with PM approval.              |
| Rule LXXXV violated by entering execution while #058 active.                                    | Specification phase only until #058 merges; documented in spec status header.                              |
| Pre-commit hook becomes slow.                                                                  | `--quick` mode budget 3 seconds maximum; tested with performance regression test.                            |

## Acceptance (Definition of Done)

- All three new audits live in `scripts/ci/` with unit tests under `scripts/ci/tests/unit/`.
- Aggregator `scripts/ci/methodology-lint.ts` invokes new and existing audits in a fixed order documented in `data-model.md`.
- `pnpm methodology:lint` runs the aggregator; supports `--quick`, `--format=json`, `--format=sarif`.
- `.github/workflows/ci.yml` `methodology` job uses the aggregator; uploads `methodology-lint-report.json` as a CI artifact.
- Allowlist file `scripts/ci/methodology-lint.allowlist.json` is committed with the initial time-boxed entries owned by Spec #060 and Spec #061.
- Allowlist meta-linter rejects malformed or expired entries.
- `docs/developer/methodology-lint.md` documents the audits, their exit codes, allowlist schema, output formats, performance budget, and "How to add a new audit".
- `docs/developer/workflow-guide.md` references the new command.
- Husky `pre-commit` hook invokes `pnpm methodology:lint --quick`.
- `pnpm tempot doctor` invokes `pnpm methodology:lint --quick --silent` and surfaces PASS/FAIL.
- Constitution updated to v2.6.0 with an Enforcement marker next to Rule XL (T031).
- `docs/ROADMAP.md` reflects Spec #059 completion.
- `.changeset/059-methodology-lint-coverage.md` issued.
- `pnpm spec:validate` reports no critical findings for this spec.
- `pnpm methodology:lint` passes on the merge target (against the time-boxed allowlist).

## Specification Phase Status

All clarifications were resolved during the 2026-06-23 session. The specification carries no remaining clarification placeholders. Specification phase is complete on 2026-06-23. Spec is ready for `/speckit.analyze` and `pnpm spec:validate`. Execution phase remains gated by Rule LXXXV until Spec #058 merges to `origin/main`.
