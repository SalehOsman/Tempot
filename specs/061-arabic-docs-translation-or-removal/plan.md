# Plan: Arabic Docs Translation or Removal

**Feature**: 061-arabic-docs-translation-or-removal
**Date**: 2026-06-24

## 1. Overview

This spec translates 27 Arabic Markdown files (across two directories) to English with full fidelity, and corrects one misclassified allowlist entry. Each translation is its own commit. After the last file in each directory is translated, the corresponding `languagePolicy` allowlist entry is removed in the same commit so the allowlist on `main` is always synchronized with reality.

## 2. Phasing

The plan ordering follows Q3 of `spec.md` — highest-value files first within each directory — so a pause anywhere on the path leaves the most-read content already in English.

| Phase | Scope                                                                                         | Commits | Reverts cleanly?               |
| ----- | --------------------------------------------------------------------------------------------- | :-----: | ------------------------------ |
| P1    | Reclassify `docs/project-analysis/2026-06-07/` allowlist entry (one commit, no content edit). |   1     | Yes (allowlist-only).           |
| P2    | Translate `docs/analysis-2026-06-10/` files in priority order (13 files).                     |   13    | Yes (per-file).                 |
| P3    | Drain `analysis-2026-06-10/` allowlist entry (combined with the last P2 commit).              |   0–1   | Yes.                            |
| P4    | Translate `docs/analysis-2026-06-23/` files in priority order (14 files).                     |   14    | Yes (per-file).                 |
| P5    | Drain `analysis-2026-06-23/` allowlist entry (combined with the last P4 commit).              |   0–1   | Yes.                            |
| P6    | Capture evidence + ROADMAP + changeset.                                                       |   1     | Yes.                            |

Total target commits: ~30 small commits.

## 3. Per-Phase Mechanics

### P1 — Reclassify `project-analysis/2026-06-07/` (FR-003)

1. Open `scripts/ci/methodology-lint.allowlist.json` (added by Spec #059 once merged).
2. Locate the `languagePolicy` entry with `pattern: "docs/project-analysis/2026-06-07/**"`.
3. Delete the entry.
4. Add a section in `implementation-notes.md` titled "Misclassification Discovery" recording:
   - The discovery date (2026-06-24, during Spec #061 specification).
   - The evidence (the file's first lines explicitly state English-only authorship).
   - A recommendation to Spec #059 maintenance: amend any seed-allowlist generator to exclude this directory pattern.
5. Commit: `chore(061): remove misclassified project-analysis/2026-06-07 allowlist entry`.
6. Run `pnpm methodology:lint`; verify the audit still exits 0 (the directory was already English; removing the entry only changes audit metadata, not findings).

### P2 — Translate `analysis-2026-06-10/` (FR-001)

For each file in priority order:

1. Read the Arabic file.
2. Translate to English. Preserve:
   - Heading levels and counts.
   - Table structures (column count, row count, column headers translated).
   - Identifiers (`ISS-NNN`, `T-NNN`, `Spec #NNN`, `Rule X`, `ADR-NNN`).
   - Numeric figures.
   - File paths and code references.
   - Cross-references to other files in the same directory.
   - English "Status update — 2026-06-XX" notes already in the file (verbatim).
3. Run `pnpm docs:check` and ensure links resolve.
4. Run a structural verification script (small inline tsx) that asserts the heading count and table count match the pre-translation snapshot.
5. Commit: `docs(061): translate analysis-2026-06-10/<filename> to English`.

Order:

1. `00-executive-summary.md` (highest readership)
2. `09-issues-and-risks-register.md` (most-referenced from external docs)
3. `10-fix-plan.md` (drives remediation plan)
4. `12-final-recommendations.md` (closing summary)
5. `01-project-structure-analysis.md`
6. `02-code-quality-analysis.md`
7. `03-architecture-analysis.md`
8. `04-docker-and-devops-analysis.md`
9. `05-security-analysis.md`
10. `06-dependencies-analysis.md`
11. `07-testing-and-quality-gates-analysis.md`
12. `08-methodology-analysis.md`
13. `11-improvement-and-development-roadmap.md`

After file 13: include the `languagePolicy` allowlist drain in the same commit.

### P3 — Drain `analysis-2026-06-10/` allowlist entry

Folded into the last P2 commit. Verification: `methodology-lint` audit count for `languagePolicy` decreases by 1.

### P4 — Translate `analysis-2026-06-23/` (FR-002)

Same mechanics as P2 applied to the second directory's 14 files. Order is the same priority pattern when the file naming matches; otherwise translate in `00 → 13` numerical order.

### P5 — Drain `analysis-2026-06-23/` allowlist entry

Folded into the last P4 commit.

### P6 — Evidence + ROADMAP + changeset

1. Capture post-translation `pnpm methodology:lint --format=json > implementation-notes-evidence/post.json`.
2. Diff against the pre-translation snapshot (captured in P0).
3. Embed an excerpt in `implementation-notes.md` showing: zero entries owned by Spec #061; if Spec #060's reclassified entry exists, it is intact and unchanged.
4. Update `docs/ROADMAP.md` Spec #061 row.
5. Add `.changeset/061-arabic-docs-translation-or-removal.md`.

## 4. File Inventory

### Files modified by translation (27)

- `docs/analysis-2026-06-10/00-executive-summary.md` through `12-final-recommendations.md` (13 files).
- `docs/analysis-2026-06-23/00-executive-summary.md` through (14 files; the count is per the directory committed on Spec #059's branch).

### Files modified for allowlist

- `scripts/ci/methodology-lint.allowlist.json` (3 entries removed).

### Files added

- `.changeset/061-arabic-docs-translation-or-removal.md`.
- `specs/061-arabic-docs-translation-or-removal/implementation-notes.md` (added during execution; not part of specification phase).

### Files referenced but not changed

- `docs/project-analysis/2026-06-07/README.md`.
- `docs/project-analysis/2026-06-07/remediation-program.md`.

## 5. Tooling

- `pnpm methodology:lint --format=json` (added by Spec #059) — produces evidence snapshots.
- `pnpm docs:check` — validates link resolution and heading uniqueness after each translation.
- `pnpm spec:validate` — verifies this spec's artifact set and FR/SC coverage.

## 6. Rollback Strategy

Every translated file is its own commit. Rollback is `git revert <commit>` for any single file. The allowlist drain is folded into the last commit of each directory; reverting that commit restores both the allowlist entry and the last file's Arabic content.

## 7. Open Items Surfaced for Spec #059

This spec discovered one defect and one coordination need for Spec #059:

1. **Misclassification**: The seed allowlist treats `docs/project-analysis/2026-06-07/` as Arabic-pending-translation. The directory is already in English. Recorded in `implementation-notes.md` for Spec #059 maintenance.
2. **Seed regeneration**: If Spec #059 regenerates its seed allowlist from a script (Spec #059's own data-model documents this is a one-time seed, not regenerated on each run, so this risk is low), the script MUST exclude this directory.

These items do not block Spec #061's merge.

## 8. Coordination With Spec #060

- Spec #060 reclassifies `arabic-numerals.helper.ts` as a permanent functional-data exemption.
- Spec #061 only touches the three directory entries it owns.
- The two specs do not edit the same allowlist entries; merge order is flexible.
- If both #060 and #061 are merged in any order, the final state is correct: zero pending-cleanup entries owned by either spec, one permanent exemption owned by Spec #060.
