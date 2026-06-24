# Research: Workspace Cleanup

**Feature**: 060-workspace-cleanup
**Date**: 2026-06-24

## 1. Grounded Investigation of Each Allowlist Entry

The Spec #059 seed allowlist (see `data-model.md` of Spec #059, lines 56-123) declares five entries owned by Spec #060. Before drafting cleanup tasks, Technical Advisor inspected each path on the working tree at `F:\Tempot` on 2026-06-24.

### 1.1 `apps/bot-server/src/bot-server.types.js`

- File exists locally (11 bytes, last modified 2026-06-11) but is listed in `.gitignore`.
- Because the file is gitignored, CI does not see it; only local methodology-lint runs catch it.
- The 11-byte size suggests an empty or near-empty emission (likely `export {};` or a single import).
- No origin spec or task explicitly creates this file. Most plausible causes:
  - A `tsc --emit` invocation with the wrong `outDir`.
  - An IDE-side ESLint/TypeScript plugin emitting declaration files.
  - A historic `pnpm build` script that wrote `.js` to `src/`.
- Recommended approach (Q1): identify the cause through `git log --diff-filter=A -- apps/bot-server/src/bot-server.types.js` and `apps/bot-server/tsconfig*.json` audit. If reproducible, fix the cause. Otherwise add a `pnpm tempot doctor` check.

### 1.2 `modules/user-management/utils/`

- Directory exists locally and is empty.
- `git ls-files modules/user-management/utils/` returns empty (no tracked files inside).
- Untracked empty directory; safe to delete.
- No source file in `modules/user-management/` references `./utils/`. Verified by static inspection: no `from './utils'` or `from '@/utils/'` in the module.

### 1.3 `apps/bot-server/scripts/webhook-manager.ts`

- File is 90 lines.
- Lines 1-2 contain `/* eslint-disable no-console */` and `/* eslint-disable max-lines-per-function */`.
- The `main` async function spans lines 27-87, approximately 60 lines (over the 50-line cap).
- 18 distinct `console.*` calls inside `main` (`console.log`, `console.error`).
- The script is a CLI tool used by maintainers to set/delete/inspect Telegram webhooks. It is not part of the bot runtime.
- The `@tempot/logger` package is available transitively (verified by `apps/bot-server/package.json` dependency closure). Plain stdout/stderr mode is supported by the logger's default transport.

### 1.4 `modules/user-management/abilities.ts`

- File is 66 lines.
- Arabic JSDoc blocks at lines 1-10, 19-22, 55-58 (≈ 18 Arabic lines total).
- All executable code is in English; only comment text is non-English.
- Translation work is purely textual; the runtime behavior is locked by tests already in place (`modules/user-management/tests/unit/abilities.test.ts` if present; otherwise covered by `start.command.test.ts` and ability-related integration tests).

### 1.5 `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts`

- File is 5 lines.
- Line 1 is a JSDoc in English: `/** Normalize Arabic-Indic numerals (٠-٩) to Western Arabic (0-9) */`.
- The Arabic Unicode characters in the file are:
  - The regex `/[٠-٩]/g` on line 3 (defines the input character class).
  - The literal `'٠١٢٣٤٥٦٧٨٩'` on line 3 (provides the index-to-character mapping).
- Both Arabic Unicode occurrences are **functional data**, not communicative text. The function's whole purpose is to normalize Arabic-Indic digits to Western Arabic. Removing them would break the function.
- The Spec #059 seed allowlist entry for this path has a factually wrong `reason`: "Arabic header comments pending Spec #060 cleanup." There are no Arabic header comments to clean up.
- Resolution (Q4): reclassify the entry as a permanent functional-data exemption with no `expires_at`. The Spec #059 meta-linter needs a follow-up amendment to accept this shape. The amendment is captured in this spec's `plan.md` Section 7 and `implementation-notes.md`.

## 2. Tooling Verification

- `pnpm methodology:lint` does not exist yet; it is added by Spec #059's execution. Spec #060 must NOT run before Spec #059 merges.
- `pnpm spec:validate` exists in `scripts/spec-validate/index.ts` and runs against this spec's directory.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration` all exist and currently pass on `main` (per ROADMAP Spec #057 evidence).
- The `@tempot/logger` package is at `packages/logger/`; its plain-text transport is the default.

## 3. Rule References (Constitution v2.5.x)

- **Rule I** (No Bypass): forbids `eslint-disable`. Drain target for FR-003.
- **Rule II** (Code Size Caps): max-lines 200, max-lines-per-function 50, max-params 3. Drives the `main` refactor in FR-003.
- **Rule XL** (Language Policy): English-only developer-facing documentation. Drain target for FR-004.
- **Rule LXXVIII** (Clean Workspace): no stale artifacts in source directories. Drain target for FR-001, FR-002.
- **Rule LXXXV** (Single Active Spec): execution blocked until #058 and #059 merge.
- **Rule LXXXIV** (Reporting and Stopping): each commit ends with a status report; the entire spec ends with the documentation sync in P6.

## 4. Alternatives Considered

### 4.1 Drain entries before #059 merges

- Rejected. Without the audit, "draining" an allowlist entry is meaningless because the entry is hypothetical. Spec #060's value is to make the audit pass with a smaller allowlist; both spec and audit must exist on the merge target.

### 4.2 Translate `abilities.ts` JSDoc in `bot-management` style (Arabic + English)

- Rejected. Rule XL is strict: English-only for developer-facing content. A bilingual JSDoc would still violate.

### 4.3 Keep the misclassified `arabic-numerals.helper.ts` entry expiring on 2026-09-21

- Rejected. The entry would silently expire and the audit would fail on a file that does not actually need cleanup. The functional-data exemption is the methodologically correct answer.

### 4.4 Refactor `webhook-manager.ts` by simply lowering the `max-lines-per-function` rule

- Rejected. That weakens the lint rule for the entire repository and creates regression risk in unrelated files. Splitting the function is the disciplined path.

### 4.5 Add a comprehensive ESLint plugin instead of methodology-lint

- Out of scope here. Spec #059 already decided on `tsx`-based standalone audits. Spec #060 must work with that decision.

## 5. Open Questions Surfaced for the Next Spec(s)

The following questions emerged during this research and are noted for follow-up specs, not for #060:

| # | Question                                                                                         | Likely owner |
| - | ------------------------------------------------------------------------------------------------ | ------------ |
| 1 | Should `methodology-lint.allowlist.json` support a top-level `meta.notes` field for human-readable narration? | Future Spec  |
| 2 | Should the meta-linter accept multiple permanent-exemption kinds (e.g., `'functional-data'`, `'vendored-code'`, `'generated-artifact'`)? | Spec #059 amendment |
| 3 | Should `scripts/tempot/doctor.ts` health checks be discoverable via a registry, or remain a manual catalog? | Future DX Spec |

## 6. Confidence

- FR-001: medium confidence; cause may not be reproducible. Q1 fallback path mitigates.
- FR-002: high confidence; trivial removal.
- FR-003: high confidence; mechanical refactor with TDD scaffolding.
- FR-004: high confidence; comment-only diff.
- FR-005: high confidence on the analysis; depends on Spec #059 amendment for full closure.
