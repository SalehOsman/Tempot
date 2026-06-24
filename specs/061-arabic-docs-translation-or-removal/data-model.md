# Data Model: Arabic Docs Translation or Removal

**Feature**: 061-arabic-docs-translation-or-removal
**Date**: 2026-06-24

This spec does not introduce any runtime data model. There is no new database table, no new event, no new in-memory structure. The "data model" here is restricted to the JSON shape of the allowlist entries that are removed, plus the per-file structural metrics that translation MUST preserve.

## 1. Allowlist Entries Removed (3 entries)

| Category         | Pattern                                            | Action  | Owner FR |
| ---------------- | -------------------------------------------------- | ------- | -------- |
| `languagePolicy` | `docs/analysis-2026-06-10/**`                       | Delete  | FR-001c  |
| `languagePolicy` | `docs/analysis-2026-06-23/**`                       | Delete  | FR-002c  |
| `languagePolicy` | `docs/project-analysis/2026-06-07/**`               | Delete  | FR-003   |

After this spec lands, each path above is removed from `scripts/ci/methodology-lint.allowlist.json` in the corresponding commit per `plan.md`.

## 2. Pre-Translation Structural Snapshot (per file)

Each translated file must preserve the following counts (captured before translation, asserted after translation):

```ts
type FileStructuralSnapshot = {
  path: string;             // relative path from repo root
  headingCount: number;     // count of lines matching ^#+ \s
  tableCount: number;       // count of lines matching ^\|.*\|$ that begin a table
  identifiers: {
    iss: string[];          // sorted unique ISS-NNN identifiers
    t: string[];            // sorted unique T-NNN identifiers
    spec: string[];         // sorted unique Spec #NNN references
    rule: string[];         // sorted unique Rule X references
    adr: string[];          // sorted unique ADR-NNN references
    ec: string[];           // sorted unique EC-NNN references
  };
  byteCountAscii: number;   // length of the ASCII subset (excludes Arabic Unicode)
  arabicCharCount: number;  // count of code points in U+0600-U+06FF (must be 0 after translation)
};
```

The pre-translation snapshot for all 27 files MUST be stored in `implementation-notes.md` under a "Pre-Translation Snapshots" section before the first P2 commit. The post-translation snapshot is computed and asserted by the verification step inside each per-file commit.

## 3. Verification Assertions (per file)

After translating file `f`:

1. `f.headingCount === pre[f.path].headingCount` (heading shape preserved).
2. `f.tableCount === pre[f.path].tableCount` (table shape preserved).
3. `f.identifiers.iss === pre[f.path].identifiers.iss` (and same for `t`, `spec`, `rule`, `adr`, `ec`).
4. `f.arabicCharCount === 0` (translation complete).
5. `pnpm docs:check` passes.

If any assertion fails, the commit is rejected and the translation is redone.

## 4. File-Level Changes (Inventory)

| Path                                                                            | Change                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `docs/analysis-2026-06-10/00-executive-summary.md`                              | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/01-project-structure-analysis.md`                     | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/02-code-quality-analysis.md`                          | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/03-architecture-analysis.md`                          | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/04-docker-and-devops-analysis.md`                     | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/05-security-analysis.md`                              | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/06-dependencies-analysis.md`                          | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/07-testing-and-quality-gates-analysis.md`             | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/08-methodology-analysis.md`                           | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/09-issues-and-risks-register.md`                      | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/10-fix-plan.md`                                       | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/11-improvement-and-development-roadmap.md`            | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-10/12-final-recommendations.md`                          | Translated to English; structure preserved.                  |
| `docs/analysis-2026-06-23/<each of 14 files>`                                   | Translated to English; structure preserved.                  |
| `docs/project-analysis/2026-06-07/README.md`                                    | **No change**.                                                |
| `docs/project-analysis/2026-06-07/remediation-program.md`                       | **No change**.                                                |
| `scripts/ci/methodology-lint.allowlist.json`                                    | 3 `languagePolicy` entries removed.                           |
| `docs/ROADMAP.md`                                                                | Spec #061 row updated to "Complete" (post-merge step).        |
| `.changeset/061-arabic-docs-translation-or-removal.md`                           | New changeset entry.                                          |
| `specs/061-arabic-docs-translation-or-removal/implementation-notes.md`           | Added during execution; not part of specification phase.      |

## 5. Tests Added or Modified

This spec is documentation-only. No application or unit tests are added or modified.

## 6. Invariants

- The methodology-lint allowlist after this spec lands contains zero entries owned by Spec #061.
- The `pnpm methodology:lint` audit MUST exit 0 after this spec merges.
- No new error codes; no `EC-NNN` introduced.
- No measurable NFR targets (translation quality is qualitative, asserted via the structural-metrics shape in Section 2).

## 7. Open Items for Spec #059 (Cross-Spec Coordination)

1. The `docs/project-analysis/2026-06-07/**` allowlist entry was a misclassification in the seed. Spec #059 maintenance should remove this from any seed-generation script if one exists.
2. Spec #059 may consider adding a "misclassification report" mode to the meta-linter that surfaces allowlist entries whose target paths show no actual violations. This is a future enhancement, not a Spec #061 dependency.
