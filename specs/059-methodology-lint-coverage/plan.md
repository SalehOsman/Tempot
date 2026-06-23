# Implementation Plan: Methodology Lint Coverage

**Feature**: 059-methodology-lint-coverage
**Branch**: `codex/059-methodology-lint-coverage` (created from `main` after Spec #058 merges; Rule LXXXV).
**Status**: SPEC APPROVED. All clarifications resolved on 2026-06-23. Execution blocked on Spec #058 merge per Rule LXXXV.
**Approved by**: Project Manager (`SalehOsman`), 2026-06-23.

## High-Level Approach

The existing `methodology` job in `.github/workflows/ci.yml` is composed of seven independent audits invoked by separate `pnpm` scripts. This plan introduces three new audits and one aggregator that consolidates all audits — both new and existing — behind a single entry point: `pnpm methodology:lint`. The aggregator becomes the single CI step for methodology gates, while preserving the ability to run any individual audit standalone.

## Architecture Fit

- **Layer**: Tooling (`scripts/ci/`), not runtime code. No interaction with `apps/`, `packages/`, or `modules/` source.
- **Tier**: N/A (scripts are outside the package tier system).
- **Methodology rules touched**: Enforces Rule I, Rule III, Rule VIII, Rule XL, Rule LXXVIII. Adds no new rules.
- **ADR**: Not required for this spec. The aggregator is a tooling convenience, not an architectural decision. If the audit pattern formalizes a new "methodology gate" abstraction later, an ADR can document the pattern.

## Components

### Foundation Libraries (`scripts/ci/lib/`)

#### L1 — `ts-token-scanner.ts`

State machine that classifies bytes of a TypeScript file into `code` / `string` / `template` / `lineComment` / `blockComment` spans. Used by `language-policy-audit.ts` to distinguish Arabic in a comment (violation) from Arabic in a test string literal (exempt per Q4).

#### L2 — `audit-result.ts`

Types (`Violation`, `AuditResult`) + deterministic sort + truncation helpers. Locked output format documented in `data-model.md`.

#### L3 — `allowlist-loader.ts`

Reads `methodology-lint.allowlist.json` and enforces the meta-linter rules from `data-model.md` (required fields, `expires_at` ≤ `added_at` + 90 days, `owner_spec` exists under `specs/`, pattern matches at least one real file). Returns exit code 2 on structural problems and exit code 1 on expired entries. Emits a warning when an entry is within 14 days of expiration.

#### L4 — `report-formatter.ts`

Produces `human`, `json`, or `sarif` outputs based on the `--format` flag.

#### L5 — `audit-runner.ts`

CLI wrapper used by each audit script. Parses `--format`, `--allowlist`, `--fixture-root`, `--silent`, `--quick`. Loads the allowlist via L3, runs the audit body, formats output via L4, returns the exit code.

### Audits (`scripts/ci/`)

#### A1 — `language-policy-audit.ts`

- **Purpose**: Detect Arabic Unicode block `U+0600–U+06FF` in developer-facing files (comments, docs, descriptions).
- **Inputs**: Roots from `data-model.md` File Discovery Roots row 1; allowlist; tokenizer L1.
- **Algorithm**:
  1. Walk roots.
  2. For `.ts` files, tokenize via L1; check Arabic only in `lineComment`, `blockComment`, and `code` spans (the latter to catch identifier names). String literals exempt if file matches `**/tests/**` or `**/*.test.ts` / `**/*.spec.ts` (Q4 Option B).
  3. For `.md` files, scan all bytes (no tokenization).
  4. Apply the allowlist; drop entries whose file matches an allowlist pattern.
  5. Emit deterministically sorted violations via L2.

#### A2 — `stale-artifacts-audit.ts`

- **Purpose**: Detect stale `.js` files in `src/` (Rule LXXVIII) and empty `utils/` directories under `modules/*/` (Rule VIII narrowed by Q5).
- **Inputs**: Roots from `data-model.md` File Discovery Roots row 2; allowlist.
- **Algorithm**:
  1. Walk allowed roots; collect `.js` files outside `dist/`, `node_modules/`, and `*.config.js`.
  2. Walk `modules/*/utils/`; flag any with zero entries.
  3. Apply the allowlist.
  4. Emit violations grouped by category (`stale-js`, `empty-utils`).

#### A3 — `eslint-disable-audit.ts`

- **Purpose**: Detect `eslint-disable*` directives outside `**/tests/**` (Rule I).
- **Inputs**: Roots from `data-model.md` File Discovery Roots row 3; allowlist.
- **Algorithm**:
  1. Walk allowed roots.
  2. For each file, regex-match `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`.
  3. Apply the allowlist.
  4. Emit violations.

### Aggregator and CLI

#### G1 — `methodology-lint.ts`

- **Purpose**: Run audits in fixed order, emit unified summary, aggregate exit code.
- **Sequence** (each shows header, output, result line):
  1. `language-policy-audit` (NEW, bit 0)
  2. `stale-artifacts-audit` (NEW, bit 1)
  3. `eslint-disable-audit` (NEW, bit 2)
  4. `source-conformance-audit` (existing, bit 3)
  5. `import-boundary-audit.cli` (existing, bit 4)
  6. `import-boundary-prisma-audit` (existing, bit 5)
  7. `authorization-coverage-audit` (existing, bit 6)
  8. `module-package-checklist-audit` (existing, bit 7)
  9. `toolchain-audit` (existing, bit 8)
  10. `test-project-inventory` (existing, bit 9)
  11. `documentation-claims-audit` (existing, bit 10)
  12. `spec-validate --all` (existing, bit 11)
  13. `pnpm cms:check` (existing, bit 12)
- **Aggregation**: `child_process.spawnSync`; final exit = bitwise OR (failure ? `1 << bit` : 0). Internal-error path returns exit 2.
- **Modes**: default = full; `--quick` = audits 0..2 only against staged files. `--format=json|sarif` switches output. `--silent` suppresses per-audit verbose output for doctor integration.
- **Constraints**: max 200 lines; helpers ≤ 50 lines.

#### G2 — `pnpm methodology:lint` scripts

Added to root `package.json`:

```json
"methodology:lint": "tsx scripts/ci/methodology-lint.ts",
"methodology:lint:quick": "tsx scripts/ci/methodology-lint.ts --quick"
```

### Integration Touchpoints

#### I1 — CI (`.github/workflows/ci.yml`)

- Replace per-audit steps in the `methodology` job with one `pnpm methodology:lint` step.
- Add `actions/upload-artifact@v4` step uploading `methodology-lint-report.json` for the run.

#### I2 — Husky pre-commit (`.husky/pre-commit`)

- Append `pnpm methodology:lint:quick` after existing lint-staged step. Quick mode budget: 3 seconds.

#### I3 — Doctor (`scripts/tempot/doctor.ts`)

- Add a check that calls `pnpm methodology:lint:quick --silent` and surfaces PASS/FAIL in the doctor summary.

#### I4 — Constitution Amendment 2.6.0

- Append an Enforcement marker line to Rule XL:
  > Enforcement: `language-policy-audit` in `scripts/ci/` (Spec #059).
- Append amendment log entry: `Amendment 2.6.0: linked Rule XL to its enforcement audit; no rule content changed.`
- Bump version header to 2.6.0.

### Documentation

- New: `docs/developer/methodology-lint.md` covering audits, exit codes, allowlist schema, output formats, performance budget, and "How to add a new audit".
- Update: `docs/developer/workflow-guide.md` linking to the new doc, pre-commit hook, and pre-push command.
- Update: `docs/ROADMAP.md` with Spec #059 row and allowlist debt counter.
- New: `.changeset/059-methodology-lint-coverage.md`.

## Testing Strategy

- **Unit tests** under `scripts/ci/tests/unit/` (eight files; see `data-model.md` File Layout):
  - `ts-token-scanner.test.ts` — quotes, templates, comments, edge cases.
  - `audit-result.test.ts` — formatting, sorting, truncation, exit handling.
  - `allowlist-loader.test.ts` — valid, malformed, expired, expiring-soon, dangling pattern, missing owner_spec.
  - `report-formatter.test.ts` — human, JSON, SARIF.
  - `language-policy-audit.test.ts` — Arabic in `.md`, in `.ts` comments, in `.ts` strings outside tests, in test string literals (exempt), allowlisted paths.
  - `stale-artifacts-audit.test.ts` — stale `.js` detected, empty `utils/` detected, populated `utils/` passes, `dist/` ignored, fixtures isolated.
  - `eslint-disable-audit.test.ts` — directive outside tests, inside tests, in `.d.ts`, in `dist/`.
  - `methodology-lint.test.ts` — child_process happy path + perf regression (≤ 30 s) + exit code mask + summary formatting.
- **Audit probes**: each audit is run against the actual production tree as a manual probe in Phase 2 (tasks T013, T016, T019). Audits MUST exit 0 with the time-boxed allowlist; outputs stored in `implementation-notes.md`.
- **TDD discipline**: every component starts with a failing test (RED); implementation makes it pass (GREEN); refactor for readability. Reviewer rejects code lacking a corresponding test commit.
- **Coverage target**: ≥ 80% lines (services tier per Rule XXXVI) on every new file under `scripts/ci/`.

## Migration / Compatibility

- Existing individual audit scripts (`boundary:audit`, etc.) remain callable directly — the aggregator only wraps them.
- No changes to package public APIs.
- No database migration.
- No changes to runtime behavior.

## Performance Budget

| Audit / Step                       | Target wall time (cold cache) |
| ---------------------------------- | ----------------------------- |
| language-policy-audit              | ≤ 3 s                         |
| stale-artifacts-audit              | ≤ 1 s                         |
| eslint-disable-audit               | ≤ 2 s                         |
| Aggregator overhead                | ≤ 2 s                         |
| Total new audits                   | ≤ 8 s                         |
| `methodology:lint:quick` mode      | ≤ 3 s                         |
| Existing audits chain (preserved)  | unchanged                     |
| Net CI delta                       | ≤ +30 s                       |

The `methodology-lint.test.ts` includes a regression test that fails the suite if total runtime exceeds 30 seconds on the monorepo.

## Rollout (Sequential PRs, each respecting Rule IX)

1. **PR 1 (Foundation)**: ship `lib/` modules + tests (T005–T009). No behavior change yet.
2. **PR 2 (Audits)**: ship the three audits + tests + fixtures (T010–T019). Audits are runnable standalone but not yet wired.
3. **PR 3 (Aggregator + CLI surface)**: ship the aggregator + package.json scripts (T020–T022). `pnpm methodology:lint` now works locally.
4. **PR 4 (Integration)**: wire CI + Husky + doctor (T023–T026). Allowlist file added here.
5. **PR 5 (Docs + Amendment)**: documentation sync (T027–T029) + Constitution Amendment 2.6.0 (T030–T032).
6. **PR 6 (Verification + Merge)**: T033–T038 verification + final merge.

Alternative: a single PR is acceptable if the diff stays focused; stacked PRs are preferred if the diff exceeds 1000 lines.

Post-merge admin (T040–T043) is performed by Project Manager outside of any PR.

## Risks (See spec.md)

This section in `spec.md` is canonical. Plan-level risks specific to implementation:

- **Risk**: native walker too slow on Windows for large monorepo. **Mitigation**: cap directory depth; skip `.git`, `node_modules`, `dist`, `coverage`.
- **Risk**: child_process aggregation silently drops errors on Windows. **Mitigation**: use `spawnSync` with `shell: true` only when needed; explicit stdio capture.
- **Risk**: `eslint-disable` detection misfires on string literals containing the phrase. **Mitigation**: tokenizer-aware match using a minimal TypeScript tokenizer, OR start with regex + small allowlist if false positives are observed.

## Documentation Sync (Rule L)

- `docs/ROADMAP.md` — add Spec #059 row with allowlist debt counter.
- `docs/developer/workflow-guide.md` — link to `methodology-lint.md`, document pre-commit and pre-push usage.
- `docs/developer/methodology-lint.md` — new; per `data-model.md` Output Formats section + How to add a new audit.
- `.specify/memory/constitution.md` — Amendment 2.6.0 marker on Rule XL (T031).
- `.changeset/059-methodology-lint-coverage.md` — required.
- `docs/architecture/adr/` — not required (tooling spec). If future audits formalize a pattern, an ADR can be added then.

## Estimated Effort

See `tasks.md` Estimated Effort section. Total Executor focused execution: ~15–17 hours. Calendar time depends on Spec #058 merge schedule and review iterations.
