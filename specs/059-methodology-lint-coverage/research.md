# Research: Methodology Lint Coverage

**Feature**: 059-methodology-lint-coverage
**Date**: 2026-06-23

## Constitutional Source of Each Rule Targeted

| Rule        | Line in `.specify/memory/constitution.md` | Phrase                                                                                                                                                            |
| ----------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule I      | (No Bypass section)                       | No `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`.                                                                                                      |
| Rule III    | (Banned Filename section)                 | No filenames named `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`.                                                                                              |
| Rule VIII   | (Clean Code section)                      | No zombie code, no empty scaffolding folders.                                                                                                                     |
| Rule XL     | 235                                       | "Everything developers see: English (code, comments, docs, ADRs, variables, README, SpecKit files)".                                                              |
| Rule XL     | 231                                       | "ZERO hardcoded user-facing text in source code. … No Arabic or any human language strings in `.ts`".                                                              |
| Rule XL     | 390                                       | "All documentation in English".                                                                                                                                   |
| Rule LXXVIII| (Workspace Cleanliness section)           | `find apps/*/src packages/*/src modules/*/* -name '*.js'` must be empty.                                                                                          |

## Current Coverage State (Audit Inventory as of 2026-06-23)

| Audit                                  | Script                                              | Rule Coverage                                                                                            |
| -------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| boundary:audit                         | `scripts/ci/import-boundary-audit.cli.ts`           | Rule XV (modules ↛ modules), Rule XIII (apps/packages/modules layering).                                |
| authorization:check                    | `scripts/ci/authorization-coverage-audit.ts`        | Rule XXVI (CASL coverage).                                                                              |
| module:checklist                       | `scripts/ci/module-package-checklist-audit.ts`      | New module checklist completeness.                                                                       |
| source:conformance                     | `scripts/ci/source-conformance-audit.ts`            | Naming conventions; partial Rule III; partial Rule LXXVIII (does NOT scan for Arabic).                  |
| toolchain:audit                        | `scripts/ci/toolchain-audit.ts`                     | Rule LXXVI (TS / Vitest / neverthrow exact pins).                                                       |
| docs:check                             | composite (`docs:freshness && docs:validate && docs:claims`) | Doc freshness and claims; does NOT enforce language.                                            |
| cms:check                              | `pnpm --filter @tempot/i18n-core cms:check`         | Rule XLIII (i18n completeness).                                                                          |
| spec:validate                          | `scripts/spec-validate/index.ts`                    | Spec artifact completeness.                                                                              |
| test:inventory                         | `scripts/ci/test-project-inventory.ts`              | Vitest project inclusion.                                                                                |
| ESLint `@typescript-eslint/no-explicit-any` | `eslint.config.js`                              | Rule I (no `any`).                                                                                       |
| ESLint `ban-ts-comment`                | `eslint.config.js`                                  | Rule I (no `@ts-ignore`/`@ts-expect-error`).                                                            |
| ESLint `no-console`                    | `eslint.config.js`                                  | Rule LXXIV.                                                                                              |
| ESLint `check-file/filename-blocklist` | `eslint.config.js`                                  | Rule III (filename blocklist).                                                                           |

### Gap Map

| Rule        | Currently Enforced?                                                                              | Gap                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Rule I (eslint-disable) | ESLint inside the file it lints, but `/* eslint-disable */` on the first line silences the file. | Need an audit that scans for the `eslint-disable*` directives directly.                                   |
| Rule VIII (empty scaffolding) | None.                                                                                      | Need a stale-artifacts audit.                                                                              |
| Rule XL (developer-facing language) | None for `.md` or comments in `.ts`.                                                       | Need a language-policy audit.                                                                              |
| Rule LXXVIII (`.js` in `src/`)   | None.                                                                                      | Covered by stale-artifacts audit.                                                                          |

## Prior Art and Reference Implementations

- `source-conformance-audit.ts` — closest existing pattern. Uses native `node:fs` walker, no external deps, sub-second runtime. New audits will follow this style.
- `toolchain-audit.ts` — example of structured exit codes and grouped output.
- `documentation-claims-audit.ts` — example of `.md` parsing.

## Decision Records (Tactical)

### D1 — Use native `node:fs` walker, not `fast-glob`

- **Reason**: Existing audits avoid adding deps; consistent with the lightweight tooling philosophy.
- **Trade-off**: Slightly more code; manageable since each audit is bounded.

### D2 — Use a minimal tokenizer for `.ts` comments vs string literals

- **Reason**: Naive regex on `[\u0600-\u06FF]` cannot distinguish a comment from a string. A 30-line state machine (track quotes, backticks, block comments, line comments) is enough.
- **Trade-off**: More logic in `language-policy-audit.ts`. Encapsulate behind a helper, tested in isolation.

### D3 — Aggregator sequential, not parallel

- **Reason**: Readability of CI logs > saving 2–3 seconds in v1.
- **Trade-off**: Slightly slower CI. Acceptable within budget.

### D4 — Bitwise OR exit code in aggregator

- **Reason**: Differentiates which audit failed in case of multiple failures, since each audit has a unique bit.
- **Trade-off**: Mild complexity in the exit handling; documented clearly.

### D5 — No new constitutional rule

- **Reason**: This spec **enforces** existing rules. It does not amend them.
- **Trade-off**: None. Future rules can plug into the aggregator.

## Alternatives Considered

- **Alt A**: A single monolithic audit script. **Rejected** because it would violate Rule II (max-lines 200) and harm readability.
- **Alt B**: Custom ESLint plugin for `.md` files. **Rejected** because ESLint's `.md` support requires `eslint-plugin-markdown` and adds complexity for a one-file rule.
- **Alt C**: GitHub Action only (no local command). **Rejected** because Rule LXXX requires local verifiability ("verification-before-completion").
- **Alt D**: Pre-commit hook only. **Rejected** because Husky pre-commit runs on staged files only; comprehensive coverage requires CI.

## Open Questions Mapped to Spec

See `spec.md` Clarifications section. Defaults proposed there are based on this research.

## Existing Arabic Content Inventory (informational, for Q1)

| Path                                         | Reason for existence                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `docs/project-analysis/2026-06-07/`           | Pre-existing audit deliverable.                                              |
| `docs/analysis-2026-06-10/`                   | Technical Advisor analysis 2026-06-10.                                       |
| `docs/analysis-2026-06-23/`                   | Technical Advisor analysis 2026-06-23 (also in Arabic, this incident).        |

Each of these is itself a Rule XL violation. They are NOT modified by this spec; Q1 decides the policy for them.

## References

- `.specify/memory/constitution.md` (v2.5.0).
- `.specify/memory/roles.md` (v1.2.0).
- `docs/developer/workflow-guide.md`.
- `docs/ROADMAP.md` (2026-06-20).
- `scripts/ci/` (existing audit scripts).
- `eslint.config.js` (existing ESLint enforcement).
