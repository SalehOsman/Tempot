# Plan: Workspace Cleanup

**Feature**: 060-workspace-cleanup
**Date**: 2026-06-24

## 1. Overview

Spec #060 drains five entries from the Spec #059 methodology-lint allowlist. Each entry is handled by a single small commit that combines the cleanup of the underlying violation with the removal (or reclassification) of the allowlist entry, so the allowlist on `main` is always synchronized with reality.

## 2. Phasing

The plan follows the order resolved in Q5 of `spec.md` — simplest first, most-invasive last — so an unexpected regression in the refactor (FR-003) never blocks the four simpler drains.

| Phase | Scope                                                                            | Commits | Reverts cleanly?                 |
| ----- | -------------------------------------------------------------------------------- | :-----: | -------------------------------- |
| P1    | Stale `.js` artifact removal + root-cause investigation (FR-001).                |  1–2    | Yes (single commit).             |
| P2    | Empty `utils/` directory removal (FR-002).                                       |   1     | Yes.                             |
| P3    | `abilities.ts` JSDoc translation (FR-004).                                       |   1     | Yes.                             |
| P4    | `arabic-numerals.helper.ts` reclassification (FR-005).                            |   1     | Yes (allowlist-only change).     |
| P5    | `webhook-manager.ts` refactor (FR-003).                                          |  2–3    | Yes (TDD + behavior-preserving). |
| P6    | Documentation sync (ROADMAP, changeset, evidence snapshots).                     |   1     | Yes.                             |

Total target commits: 7–9 small commits. Each commit is independently revertable.

## 3. Per-Phase Mechanics

### P1 — Stale `.js` artifact

1. Investigate root cause (compile flag, IDE plugin, build script). Look at `apps/bot-server/tsconfig.build.json`, `apps/bot-server/package.json`, and any script in `scripts/tempot/` that could emit `.js` into `apps/bot-server/src/`.
2. If reproducible:
   - Fix the cause (e.g., tighten the `tsconfig.build.json` `outDir`, or stop the offending script).
   - Add a unit test or `pnpm tempot doctor` check that verifies the artifact is not produced after `pnpm build`.
3. If not reproducible:
   - Add a `pnpm tempot doctor` health check that detects the artifact and prints a remediation hint.
4. Delete the local artifact: `Remove-Item 'F:\Tempot\apps\bot-server\src\bot-server.types.js'`.
5. Remove the `staleArtifacts` entry for `apps/bot-server/src/bot-server.types.js` from `scripts/ci/methodology-lint.allowlist.json`.

### P2 — Empty `utils/` directory

1. Confirm via `grep -r "from\\s*['\"]\\.\\./utils\\b" modules/user-management/` that nothing imports from the directory.
2. Delete: `Remove-Item -Recurse modules/user-management/utils`.
3. Remove the `staleArtifacts` entry for `modules/user-management/utils/`.

### P3 — `abilities.ts` JSDoc translation

1. Read every Arabic JSDoc block in `modules/user-management/abilities.ts`.
2. Produce English equivalents that preserve every fact: role list, subject list, action list, the contract relating `userManagementAbilities()` to `AbilityFactory.build()`.
3. Replace the JSDoc text only; do not touch executable code.
4. Verify `git diff` is comment-only.
5. Run `pnpm test:unit --filter user-management` and `pnpm test:integration --filter user-management`.
6. Remove the `languagePolicy` entry for `modules/user-management/abilities.ts`.

### P4 — `arabic-numerals.helper.ts` reclassification

1. Modify the allowlist entry in `scripts/ci/methodology-lint.allowlist.json`:
   - Remove `expires_at`.
   - Set `exemption_kind: "functional-data"` (new field).
   - Update `reason` to: "Arabic-Indic digit set required by the function's normalization contract; no comments in the file, the Unicode characters are part of the function's input alphabet."
2. Document the new `exemption_kind` shape in `data-model.md` and in `implementation-notes.md` as a note flagging a future Spec #059 meta-linter amendment so it accepts the shape.
3. Do not touch `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` itself.

### P5 — `webhook-manager.ts` refactor

1. RED: Write `apps/bot-server/tests/unit/scripts/webhook-manager.test.ts` that:
   - Imports `runSet`, `runDelete`, `runInfo` helpers (do not exist yet).
   - Provides a mock `bot.api` with `setWebhook`, `deleteWebhook`, `getWebhookInfo`.
   - Asserts the field set printed by `runInfo` matches the pre-refactor field set.
   - Asserts `runSet` calls `setWebhook` with the right URL and secret token.
2. GREEN: Refactor `apps/bot-server/scripts/webhook-manager.ts`:
   - Extract `runSet`, `runDelete`, `runInfo` as exported async helpers (≤ 50 lines each).
   - Reduce `main` to argv parsing + dispatcher (≤ 50 lines).
   - Replace every `console.*` with `@tempot/logger` calls. Preserve message texts. For CLI output, configure the logger to use plain stdout/stderr (no JSON) when invoked as a script.
3. Remove the two `eslint-disable` directives.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` (filtered to bot-server).
5. Remove the `eslintDisable` entry for `apps/bot-server/scripts/webhook-manager.ts`.

### P6 — Documentation sync

1. Capture `pnpm methodology:lint --format=json > implementation-notes-evidence/pre.json` BEFORE any drain (done in P0 as an initial snapshot). Actually this happens at the start of execution — see Phase 0 in tasks.md.
2. Capture `pnpm methodology:lint --format=json > implementation-notes-evidence/post.json` AFTER P5.
3. Diff and embed an excerpt in `implementation-notes.md`.
4. Update `docs/ROADMAP.md` Spec #060 row to "Complete" with merge commit link.
5. Add `.changeset/060-workspace-cleanup.md` describing the drained debt.
6. Reference Spec #061 as the next-up drain (analysis docs).

## 4. File Inventory

### Files removed

- `apps/bot-server/src/bot-server.types.js` (local-only; not in git).
- `modules/user-management/utils/` (empty directory).

### Files modified

- `apps/bot-server/scripts/webhook-manager.ts` (refactor + logger).
- `modules/user-management/abilities.ts` (JSDoc translation only).
- `scripts/ci/methodology-lint.allowlist.json` (4 entries removed + 1 entry reclassified).
- `docs/ROADMAP.md` (Spec #060 row updated).

### Files added

- `apps/bot-server/tests/unit/scripts/webhook-manager.test.ts` (new unit test).
- `.changeset/060-workspace-cleanup.md`.
- Optional: a new health-check function under `scripts/tempot/doctor.ts` if Q1's discovery path requires it.

### Files referenced but not changed

- `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts` (reclassified in allowlist only).

## 5. Tooling

- `tsx scripts/ci/methodology-lint.ts --format=json` — produced by Spec #059 once merged; used here for evidence snapshots.
- `pnpm spec:validate` — verifies this spec's artifact set and FR/SC coverage.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration` — standard quality gates.

## 6. Rollback Strategy

Every cleanup is its own commit. Rollback is `git revert <commit>` for any single drain. The refactor in P5 is bracketed by RED+GREEN test commits; reverting the GREEN commit restores the prior state.

## 7. Open Items Surfaced for Spec #059

This spec discovered three actionable defects in Spec #059's seed allowlist:

1. The `reason` field for `arabic-numerals.helper.ts` is factually wrong ("Arabic header comments pending Spec #060 cleanup"); see FR-005.
2. The meta-linter as specified does not support a permanent-exemption shape; an amendment is required to allow `exemption_kind: 'functional-data'` to opt out of the `expires_at ≤ added_at + 90 days` rule.
3. The seed allowlist does not include an entry for any test fixture under `scripts/ci/tests/__fixtures__/language-policy/` even though those fixtures contain intentional Arabic content. Spec #059 needs to either exempt that path explicitly or rely on Q4's `**/tests/__fixtures__/**` exemption (currently scoped to string literals only; comments and prose are not exempt). This is recorded here for Spec #059's executor to address; Spec #060 does NOT modify Spec #059's files.

These items are documented in `implementation-notes.md` during execution and do not block this spec's merge.
