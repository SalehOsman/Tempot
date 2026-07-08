# Feature Specification: Arabic Docs Translation or Removal

**Feature Branch**: `codex/061-arabic-docs-translation-or-removal` (created from `main` on 2026-06-24; Rule LXXXV blocks execution until Specs #058 and #059 merge)
**Created**: 2026-06-24
**Status**: SPEC APPROVED (Specification phase complete on 2026-06-24). Execution blocked on Spec #058 and Spec #059 merges per Rule LXXXV.
**Approved by**: Project Manager (`SalehOsman`), 2026-06-24.
**Executor (planned)**: AI Executor under Project Manager oversight (Three-Role Framework).
**Input**: Spec #059 seeds three `languagePolicy` allowlist entries owned by this spec, all expiring 2026-09-21. Grounded inspection on 2026-06-24 found one misclassification: `docs/project-analysis/2026-06-07/` is already in English. The two genuine Arabic directories (`docs/analysis-2026-06-10/` with 13 files / ~94 KB, and `docs/analysis-2026-06-23/` with 14 files / ~96 KB) require translation. The Project Manager has indicated retention preference, so this spec translates rather than removes.

## Goals

- **G1**: Translate every Markdown file under `docs/analysis-2026-06-10/` from Arabic to English with full fidelity.
- **G2**: Translate every Markdown file under `docs/analysis-2026-06-23/` from Arabic to English with full fidelity.
- **G3**: Remove the misclassified `languagePolicy` allowlist entry for `docs/project-analysis/2026-06-07/`.
- **G4**: Drain the two genuine `languagePolicy` allowlist entries after their directories are fully translated.
- **G5**: Capture before/after `methodology-lint --format=json` snapshots as audit evidence.

## Non-Goals

- Do **not** delete the analyses; retention is required (PM decision).
- Do **not** create new analysis content; translation is faithful rendering only.
- Do **not** modify any spec, code, or test fixture.
- Do **not** translate Arabic content under `scripts/ci/tests/__fixtures__/language-policy/**`; those are intentional fixtures.
- Do **not** translate Arabic content inside functional code (handled by Spec #060's reclassification work for the Arabic-numerals helper).

## Clarifications

### Session 2026-06-24 (Resolved)

- **Q1 — Retain or remove?** RETAIN. Translate every file. The PM's earlier "do not delete" instruction applies.

- **Q2 — Fidelity standard**: Faithful translation. Every numeric figure, file path, spec reference (`Spec #NNN`), rule reference (`Rule X`), and identifier (`ISS-NNN`, `T-NNN`, `ADR-NNN`) MUST be preserved exactly. Cross-references between files MUST continue to work.

- **Q3 — Order**: Highest-value files first within each directory: (1) `00-executive-summary.md`, (2) `09-issues-and-risks-register.md`, (3) `10-fix-plan.md`, (4) `12-final-recommendations.md`, (5) remaining files in numerical order.

- **Q4 — `analysis-2026-06-23/` while #059 is unmerged**: Directory is currently untracked on `main`; committed only on `codex/059-methodology-lint-coverage`. Spec #061 execution starts AFTER #059 merges so the directory is tracked.

- **Q5 — English status-update notes already in some Arabic files**: Preserve verbatim during translation; only the surrounding Arabic prose gets translated.

- **Q6 — `project-analysis/2026-06-07/` reclassification mechanics**: One-line allowlist edit. No content change. Discovery documented in `implementation-notes.md` for Spec #059 to amend any seed generator.

- **Q7 — Commit granularity**: One translated file per commit for review clarity.

- **Q8 — Keep the original Arabic copies?** No. Translation REPLACES Arabic content at the same path. Git history preserves the originals forever.

### Strategy Decision (Resolved)

Translate file-by-file, commit-by-commit. Drain each directory's allowlist entry only after its LAST file is translated. The `project-analysis/2026-06-07/` reclassification is a single early commit.

## User Scenarios & Testing

### User Story 1 — `docs/analysis-2026-06-10/` fully in English (Priority: P0)

A maintainer browses the directory; every file is in English with structure preserved.

**Independent Test**: `grep -rP '[\p{Arabic}]' docs/analysis-2026-06-10/` returns zero matches. Heading count, table count, and identifier list per file match the pre-translation snapshot recorded in `implementation-notes.md`.

**Acceptance Criteria**:

- **FR-001**: Zero code points in `U+0600-U+06FF` in any file under `docs/analysis-2026-06-10/`.
- **FR-001a**: Pre-translation heading count, table count, and identifier list preserved per file.
- **FR-001b**: English "Status update — 2026-06-XX" notes preserved verbatim.
- **FR-001c**: After the last file is translated, the `languagePolicy` allowlist entry is removed in that commit.
- **FR-001d**: `pnpm docs:check` passes.

### User Story 2 — `docs/analysis-2026-06-23/` fully in English (Priority: P0)

After Spec #059 merges, the directory is on `main` and gets translated with the same fidelity standard.

**Independent Test**: Same shape as User Story 1 applied to this directory.

**Acceptance Criteria**:

- **FR-002**: Zero code points in `U+0600-U+06FF` in any file under `docs/analysis-2026-06-23/`.
- **FR-002a**: Pre-translation structure metrics preserved per file.
- **FR-002b**: Cross-references to `analysis-2026-06-10/`, `project-analysis/2026-06-07/`, and `specs/` continue to work.
- **FR-002c**: `languagePolicy` allowlist entry removed after the last file commit.
- **FR-002d**: `pnpm docs:check` passes.

### User Story 3 — `project-analysis/2026-06-07/` allowlist entry corrected (Priority: P1)

The misclassified entry is removed; the directory's files are unchanged and remain in English.

**Independent Test**: `grep -F 'docs/project-analysis/2026-06-07' scripts/ci/methodology-lint.allowlist.json` returns nothing. The two existing files are byte-identical to their pre-spec state.

**Acceptance Criteria**:

- **FR-003**: The `languagePolicy` allowlist entry whose `pattern` references `docs/project-analysis/2026-06-07/` is removed.
- **FR-003a**: `README.md` and `remediation-program.md` are NOT modified.
- **FR-003b**: `implementation-notes.md` records the misclassification finding for Spec #059's seed maintenance.
- **FR-003c**: `pnpm methodology:lint` exits 0 against the directory without an allowlist entry.

### User Story 4 — Translation evidence captured (Priority: P1)

PR reviewer inspects before/after JSON snapshots; three `languagePolicy` entries removed; zero new violations.

**Acceptance Criteria**:

- **FR-004**: `implementation-notes.md` contains the JSON snapshot diff.
- **FR-004a**: PR description links to the snapshots.

## Out of Scope

- Translation of any Arabic content outside the three referenced directories.
- Creation of an Arabic-version archive (Q8 resolves to no parallel Arabic copies).
- Spec #059 seed allowlist generator changes (recorded as cross-spec coordination only).

## Constraints

- Each commit translates exactly one Markdown file plus, optionally, the allowlist entry removal in the last-file commit per directory.
- `pnpm docs:check` MUST pass after each commit.
- No structural changes (heading levels, table shapes) during translation.
- Cross-references MUST be updated when targets are renamed (none planned, but documented as a constraint).

## Success Metrics

- **SC-001**: All three `languagePolicy` allowlist entries owned by Spec #061 are removed after this spec lands.
- **SC-002**: `grep -rP '[\p{Arabic}]' docs/analysis-2026-06-10/ docs/analysis-2026-06-23/` returns zero matches.
- **SC-003**: `pnpm docs:check` passes on the post-spec tree.
- **SC-004**: `pnpm methodology:lint` exits 0 with the reduced allowlist.

## Dependencies

- **Blocked by**: Spec #058 merge to `origin/main` (Rule LXXXV).
- **Blocked by**: Spec #059 merge to `origin/main` (the audit and allowlist mechanism this spec drains).
- **Drains**: 3 entries from Spec #059's `languagePolicy` allowlist seed.

## Risks

| Risk                                                                         | Mitigation                                                                                          |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Translation introduces meaning drift.                                          | Per-file commits; reviewer compares pre-translation Arabic against post-translation English diff.   |
| `analysis-2026-06-23/` is not yet on `main` when Spec #061 starts.            | Q4 resolution: Spec #061 starts only after #059 merges; verified by T003 in `tasks.md`.             |
| Cross-references break.                                                        | `pnpm docs:check` runs after each commit; broken links fail the gate.                                |
| Translation effort exceeds time budget.                                        | Q3 ordering ensures highest-value files are translated first; pause-resume is safe at file boundary. |
| Spec #059 seed regenerates the misclassified entry.                            | FR-003b records the finding; Spec #059's executor amends the seed.                                  |

## Acceptance (Definition of Done)

- All Markdown files under `docs/analysis-2026-06-10/` and `docs/analysis-2026-06-23/` are in English (zero Arabic code points).
- `scripts/ci/methodology-lint.allowlist.json` contains no entries owned by Spec #061.
- `pnpm methodology:lint` exits 0.
- `pnpm docs:check` passes.
- `pnpm spec:validate` reports no critical findings for Spec #061.
- `implementation-notes.md` contains before/after JSON snapshots and the misclassification finding.
- `docs/ROADMAP.md` reflects Spec #061 completion.
- `.changeset/061-arabic-docs-translation-or-removal.md` issued.

## Specification Phase Status

All clarifications resolved on 2026-06-24. Specification phase complete. Spec is ready for `/speckit.analyze` and `pnpm spec:validate`. Execution phase remains gated by Rule LXXXV until both Spec #058 and Spec #059 merge to `origin/main`.
