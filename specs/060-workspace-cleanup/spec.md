# Feature Specification: Workspace Cleanup

**Feature Branch**: `codex/060-workspace-cleanup` (created from `main` on 2026-06-24; Rule LXXXV blocks execution until Spec #058 merges)
**Created**: 2026-06-24
**Status**: SPEC APPROVED (Specification phase complete on 2026-06-24). Execution blocked on Spec #058 merge AND Spec #059 merge per Rule LXXXV and per the methodology-lint allowlist mechanism this spec drains.
**Approved by**: Project Manager (`SalehOsman`), 2026-06-24.
**Executor (planned)**: AI Executor under Project Manager oversight (Three-Role Framework, `roles.md`).
**Input**: Spec #059 (Methodology Lint Coverage) introduces a time-boxed allowlist with five entries owned by this spec, each expiring on 2026-09-21. If those entries are not drained, the `methodology-lint` CI gate will fail starting 2026-09-21. Additionally, on 2026-06-24, grounded inspection revealed that one of the five entries (the Arabic-numerals helper) was misclassified — there are no Arabic comments to translate; the Arabic Unicode there is functional regex and string data. This spec resolves the four genuine cleanups and proposes a reclassification for the misclassified entry through a controlled Spec #059 amendment.

## Goals

- **G1**: Remove the stale `apps/bot-server/src/bot-server.types.js` artifact from local working trees and prevent its recurrence.
- **G2**: Remove the empty `modules/user-management/utils/` scaffolding directory.
- **G3**: Refactor `apps/bot-server/scripts/webhook-manager.ts` to remove both `eslint-disable` directives without weakening linting.
- **G4**: Translate every Arabic JSDoc block in `modules/user-management/abilities.ts` to English without changing runtime behavior.
- **G5**: Reclassify the Spec #059 allowlist entry for `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` from a time-boxed pending-cleanup entry into a permanent functional-data exemption with a precise reason, after grounded inspection confirms there is no Arabic comment to translate.
- **G6**: Remove every drained allowlist entry from `scripts/ci/methodology-lint.allowlist.json` after the corresponding cleanup lands, so the allowlist accurately reflects remaining debt.

## Non-Goals

- Do **not** widen the audit surface or add new methodology rules. Spec #059 owns that.
- Do **not** translate Arabic prose in `docs/analysis-2026-06-10/`, `docs/analysis-2026-06-23/`, or `docs/project-analysis/2026-06-07/`. Spec #061 owns that.
- Do **not** change the behavior of `webhook-manager.ts`; the refactor is purely structural and logging-channel.
- Do **not** modify any module's public API.
- Do **not** add new tests beyond what is necessary to keep the refactor verifiable; no new product features.

## Clarifications

### Session 2026-06-24 (Resolved)

All questions resolved by Project Manager on 2026-06-24 based on Technical Advisor analysis (Rule LXXXIV).

- **Q1 — Source of the local `bot-server.types.js` artifact**: Root cause discovery is part of the spec (task T010). If the cause is reproducible (e.g., a `tsc --emit` flag, a script side-effect, or an IDE plugin), the spec MUST fix the cause AND remove the local file. If the cause cannot be reproduced, the spec MUST add a hardening check to `pnpm tempot doctor` that surfaces the artifact's presence with a remediation hint.

- **Q2 — `webhook-manager.ts` logging channel**: Replace direct `console.*` with the `@tempot/logger` package. The script is invoked as a one-off CLI by maintainers; the logger MUST output to stdout/stderr in plain-text mode when no structured-log sink is configured (already supported by `@tempot/logger`'s default transport).

- **Q3 — `webhook-manager.ts` `main` function size**: Split `main` into one helper per `action` (`set`, `delete`, `info`), each ≤ 50 lines, plus a thin dispatcher. This satisfies `max-lines-per-function` without weakening the lint rule.

- **Q4 — `arabic-numerals.helper.ts` reclassification**: The file's only Arabic content is the regex `/[٠-٩]/g` and the literal `'٠١٢٣٤٥٦٧٨٩'`. Both are **functional** (the function's whole purpose is to normalize Arabic-Indic numerals). The Spec #059 allowlist entry's `reason` field ("Arabic header comments pending Spec #060 cleanup") is factually wrong. Reclassification: convert the entry into a **permanent functional-data exemption** with no expiry, owned by Spec #060 (this spec), reasoned as "Arabic-Indic digit set required by the function's normalization contract."

- **Q5 — Order of cleanup**: Drain the entries in the order that minimizes risk: simplest first (FR-001, FR-002), then translation (FR-004), then reclassification (FR-005), then the most invasive refactor (FR-003). Reason: a regression in the refactor must not block the simpler wins.

- **Q6 — Test budget**: All existing tests MUST still pass after each cleanup. No new tests are required except: (a) a unit test for the split helpers in `webhook-manager.ts` to lock in the dispatcher behavior; (b) a regression test that the `pnpm tempot doctor` artifact-check (if introduced by Q1's discovery branch) surfaces the right hint.

### Strategy Decision (Resolved)

Drain each entry incrementally with its own commit so each cleanup is reviewable in isolation. The allowlist file is updated in the same commit as the cleanup. This makes regressions trivially revertable and keeps the methodology-lint allowlist always accurate.

## User Scenarios & Testing

### User Story 1 — Stale `.js` artifact removed and prevented (Priority: P0)

A maintainer pulls the latest `main` and runs `pnpm methodology:lint`. The aggregator reports zero violations for the `stale-artifacts` audit. The file `apps/bot-server/src/bot-server.types.js` is not present in any working tree, and the build/typecheck/test pipeline does not recreate it.

**Why this priority**: Reduces noise in local methodology-lint runs and shrinks the allowlist debt.

**Independent Test**: After this spec lands, on a clean checkout: run `pnpm install` and `pnpm typecheck`. The file MUST NOT appear under `apps/bot-server/src/`. Then run `pnpm methodology:lint --quick`. Audit MUST exit 0 without consulting any allowlist entry for that path.

**Acceptance Criteria**:

- **FR-001**: `apps/bot-server/src/bot-server.types.js` is absent from every local working tree after running `pnpm install && pnpm build`.
- **FR-001a**: The root cause of the artifact's creation is identified in `implementation-notes.md` (compiler flag, IDE setting, or script side-effect).
- **FR-001b**: A preventive control is in place (either: a fix to the cause if reproducible; or a `pnpm tempot doctor` check that detects the artifact and prints the remediation hint).
- **FR-001c**: The `scripts/ci/methodology-lint.allowlist.json` entry for this path is removed in the same commit.

### User Story 2 — Empty `utils/` directory removed (Priority: P0)

A maintainer inspects `modules/user-management/`. There is no empty `utils/` scaffolding directory. The module structure reflects only directories that hold actual code.

**Why this priority**: Trivial cleanup; one of the smallest possible allowlist entries to drain.

**Independent Test**: After this spec lands: `git status` on a clean checkout shows no `modules/user-management/utils/` directory. The module's tests and integration tests still pass (`pnpm test:unit --filter user-management`, `pnpm test:integration --filter user-management`).

**Acceptance Criteria**:

- **FR-002**: `modules/user-management/utils/` directory does not exist.
- **FR-002a**: No source file under `modules/user-management/` imports from `./utils/` or `./utils/<anything>`.
- **FR-002b**: The `scripts/ci/methodology-lint.allowlist.json` entry for this path is removed in the same commit.

### User Story 3 — `webhook-manager.ts` refactored, lint clean (Priority: P1)

A maintainer opens `apps/bot-server/scripts/webhook-manager.ts`. There is no `eslint-disable` directive in the file. The `main` function is a thin dispatcher; each action (`set`, `delete`, `info`) is its own helper of ≤ 50 lines. Logging is routed through `@tempot/logger`.

**Why this priority**: Closes a Rule I loophole and demonstrates the audit catches future regressions.

**Independent Test**: After this spec lands: `pnpm lint --max-warnings 0 apps/bot-server/scripts/webhook-manager.ts` exits 0. `pnpm tsx apps/bot-server/scripts/webhook-manager.ts info` (against a test bot token) still prints webhook information with the same fields and order as before, validated by capturing both pre-spec and post-spec output and asserting equality on the field set (modulo formatting noise).

**Acceptance Criteria**:

- **FR-003**: `apps/bot-server/scripts/webhook-manager.ts` contains zero `eslint-disable`, `eslint-disable-next-line`, or `eslint-disable-line` directives.
- **FR-003a**: `main` function is ≤ 50 lines and contains only argv parsing plus dispatch to action helpers.
- **FR-003b**: Each action helper (`runSet`, `runDelete`, `runInfo`) is ≤ 50 lines and is unit-tested with a mock `bot.api`.
- **FR-003c**: All `console.*` calls are replaced with `@tempot/logger` invocations using the existing logger contract.
- **FR-003d**: `pnpm test:unit` for `bot-server` passes.
- **FR-003e**: The `scripts/ci/methodology-lint.allowlist.json` entry for this path is removed in the same commit.

### User Story 4 — `abilities.ts` JSDoc in English (Priority: P1)

A maintainer opens `modules/user-management/abilities.ts`. All JSDoc blocks are in English. The exported functions, types, and behavior are byte-for-byte identical with the pre-spec version when comments are stripped.

**Why this priority**: Closes the Rule XL violation in production source code (highest-visibility Arabic-comment location).

**Independent Test**: After this spec lands: `git diff main -- modules/user-management/abilities.ts` shows only JSDoc text changes. `pnpm test:unit --filter user-management` and `pnpm test:integration --filter user-management` pass. A grep for `[\u0600-\u06FF]` (Arabic block) inside the file returns zero matches.

**Acceptance Criteria**:

- **FR-004**: `modules/user-management/abilities.ts` contains zero code points in the Unicode range `U+0600-U+06FF`.
- **FR-004a**: All translated JSDoc preserves the original information: role list (GUEST, USER, ADMIN, SUPER_ADMIN), subject list (`profile`, `users`, `all`), action list (`read`, `update`, `manage`), and the relationship between `userManagementAbilities()` and `AbilityFactory.build()`.
- **FR-004b**: `pnpm typecheck` and `pnpm lint` pass.
- **FR-004c**: The `scripts/ci/methodology-lint.allowlist.json` entry for this path is removed in the same commit.

### User Story 5 — `arabic-numerals.helper.ts` reclassified as functional-data exemption (Priority: P1)

A maintainer audits the methodology-lint allowlist. The `arabic-numerals.helper.ts` entry no longer has an `expires_at` because the Arabic Unicode there is the function's input alphabet, not a translatable comment. The entry's `reason` accurately describes why it is permanent. A separate constitutional consideration (whether to extend Rule XL with a "functional-data exemption" clause) is captured for a future amendment.

**Why this priority**: Corrects a factual error in Spec #059's allowlist seed before the audit runs, so the audit does not start its life with a misclassified entry.

**Independent Test**: After this spec lands: open `scripts/ci/methodology-lint.allowlist.json`. The `arabic-numerals.helper.ts` entry has no `expires_at` (or `expires_at` set to a sentinel value documented in `data-model.md`), and its `reason` mentions "Arabic-Indic digit set required by the function's normalization contract." The Spec #059 meta-linter MUST accept the permanent-exemption shape (see Spec #059 amendment described in this spec's `plan.md`).

**Acceptance Criteria**:

- **FR-005**: The allowlist entry for `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` is reclassified as permanent functional-data exemption.
- **FR-005a**: The entry's `reason` is ≥ 40 characters and explicitly cites "functional data" or equivalent terminology.
- **FR-005b**: `data-model.md` for this spec documents the permanent-exemption shape (no `expires_at`, or a designated sentinel `expires_at: never`).
- **FR-005c**: A note in this spec's `implementation-notes.md` references the proposed Spec #059 meta-linter amendment required to accept the permanent-exemption shape.
- **FR-005d**: No code change to `arabic-numerals.helper.ts` itself is required; the file's current content is correct.

## Out of Scope

- Arabic prose in `docs/**` — handled by Spec #061.
- Any new methodology rules or audits — handled by Spec #059.
- Any new product features in `webhook-manager.ts` — only structural refactor and logging channel change.
- Removing the `arabic-numerals.helper.ts` file itself — the file is correct as-is.
- Modifying the Constitution itself; only the methodology-lint allowlist file is touched.

## Constraints

### Code constraints

- All edits MUST keep `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm test:integration` at the same pass/fail state they were in immediately before each commit (i.e., do not regress any gate).
- The refactor of `webhook-manager.ts` MUST be behavior-preserving as defined by the field-set assertion in User Story 3's Independent Test.
- Translation of `abilities.ts` MUST be byte-for-byte identical outside JSDoc.
- No new runtime dependency adds; `@tempot/logger` is already a transitive workspace dependency available to `apps/bot-server`.

### Allowlist mechanism constraints

- Each drained allowlist entry MUST be removed in the same commit as the corresponding cleanup, so methodology-lint state on `main` is always accurate.
- The reclassified `arabic-numerals.helper.ts` entry MUST be the only entry in the allowlist with the permanent-exemption shape after this spec lands. Future permanent exemptions require their own spec authorization.

### Quality-gate constraints

- After every commit on this branch, the maintainer MUST run `pnpm methodology:lint` locally and verify the audit count decreases by exactly the number of drained entries in that commit.
- The PR MUST include before/after `methodology-lint --format=json` snapshots in `implementation-notes.md` to prove the allowlist drain.

## Success Metrics

- **SC-001**: `methodology-lint` allowlist has at most one permanent-exemption entry after this spec merges (the reclassified `arabic-numerals.helper.ts`).
- **SC-002**: All five originally-listed pending-cleanup entries owned by Spec #060 are either drained (FR-001 through FR-004) or reclassified (FR-005); none remains pending past the merge date.
- **SC-003**: `pnpm lint apps/bot-server/scripts/webhook-manager.ts` returns zero warnings or errors.
- **SC-004**: `grep -r '[\u0600-\u06FF]' modules/user-management/abilities.ts` returns no matches.
- **SC-005**: A clean checkout followed by `pnpm install && pnpm build` does not create `apps/bot-server/src/bot-server.types.js`.

## Dependencies

- **Blocked by**: Spec #058 (Bot Access Mode Membership Gate) merge to `origin/main`, per Rule LXXXV.
- **Blocked by**: Spec #059 (Methodology Lint Coverage) merge to `origin/main`. Without #059's allowlist mechanism, draining entries is not meaningful; the audits don't exist yet to verify the drain.
- **Methodology constraint**: Rule LXXXV permits parallel specification, blocks parallel execution. This spec is fully specified now; execution waits until both #058 and #059 are on `main`.
- **Drains**: Three entries in `language-policy`, two entries in `staleArtifacts`, one entry in `eslintDisable` of the Spec #059 allowlist seed.

## Risks

| Risk                                                                                          | Mitigation                                                                                                |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Translating `abilities.ts` JSDoc accidentally changes runtime semantics (e.g., role list).    | Diff is restricted to comment lines only, verified by `git diff --stat` and by re-running existing tests. |
| `webhook-manager.ts` refactor changes user-facing log lines, breaking maintainer muscle memory.| Field-set assertion in US3 independent test; logger output preserved to the same destinations.            |
| `bot-server.types.js` root cause cannot be reproduced.                                         | Fall back to detection in `pnpm tempot doctor`; this is the Q1 fallback path.                              |
| Spec #059 meta-linter does not accept the permanent-exemption shape.                          | This spec includes a Spec #059 follow-up amendment (no `expires_at` allowed when entry has a designated `exemption_kind: 'functional-data'`). |
| Drained allowlist entries are reintroduced by accident in a later commit.                     | `methodology-lint --format=json` snapshot in implementation-notes.md serves as baseline for regression check. |
| #058 takes much longer than expected, pushing #060 close to the 2026-09-21 expiration.        | This spec is small (estimated 4 hours of execution); the 2026-09-21 deadline has substantial slack.        |

## Acceptance (Definition of Done)

- All five `methodology-lint.allowlist.json` entries listed in `data-model.md` are either deleted or converted to the permanent-exemption shape.
- `pnpm methodology:lint` exits 0 against the production tree after this spec's commits, without any entry that has `expires_at < today`.
- `pnpm lint` passes with zero warnings.
- `pnpm test:unit` and `pnpm test:integration` are green for `bot-server` and `user-management`.
- `pnpm typecheck` passes.
- `pnpm spec:validate` reports no critical findings for Spec #060.
- `implementation-notes.md` contains before/after `methodology-lint --format=json` snapshots.
- `docs/ROADMAP.md` reflects Spec #060 completion.
- `.changeset/060-workspace-cleanup.md` issued.
- A note in `implementation-notes.md` documents the proposed Spec #059 meta-linter amendment for permanent-exemption shape acceptance (does NOT amend #059 directly — that is the next spec's responsibility if approved).

## Specification Phase Status

All clarifications were resolved during the 2026-06-24 session. The specification carries no remaining clarification placeholders. Specification phase is complete on 2026-06-24. Spec is ready for `/speckit.analyze` and `pnpm spec:validate`. Execution phase remains gated by Rule LXXXV until Spec #058 AND Spec #059 merge to `origin/main`.
