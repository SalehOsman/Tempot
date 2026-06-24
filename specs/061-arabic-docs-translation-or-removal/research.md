# Research: Arabic Docs Translation or Removal

**Feature**: 061-arabic-docs-translation-or-removal
**Date**: 2026-06-24

## 1. Grounded Inspection of Each Allowlist Entry

The Spec #059 seed allowlist declares three `languagePolicy` entries owned by Spec #061. Technical Advisor inspected each on the working tree at `F:\Tempot` on 2026-06-24.

### 1.1 `docs/analysis-2026-06-10/`

- 13 Markdown files totaling ~94 KB.
- File listing:
  - `00-executive-summary.md` (7,453 B)
  - `01-project-structure-analysis.md` (5,921 B)
  - `02-code-quality-analysis.md` (5,207 B)
  - `03-architecture-analysis.md` (6,044 B)
  - `04-docker-and-devops-analysis.md` (6,679 B)
  - `05-security-analysis.md` (5,398 B)
  - `06-dependencies-analysis.md` (5,382 B)
  - `07-testing-and-quality-gates-analysis.md` (5,034 B)
  - `08-methodology-analysis.md` (9,767 B)
  - `09-issues-and-risks-register.md` (12,095 B)
  - `10-fix-plan.md` (9,807 B)
  - `11-improvement-and-development-roadmap.md` (7,740 B)
  - `12-final-recommendations.md` (7,566 B)
- Sampled content (first 20 lines of `02-code-quality-analysis.md` and `09-issues-and-risks-register.md` and `10-fix-plan.md`) confirms heavily Arabic prose, Arabic table headers, Arabic identifiers in some places (e.g., `الملخص التنفيذي` for "Executive Summary").
- Some files contain English "Status update — 2026-06-XX" notes appended at the top (e.g., `00-executive-summary.md` lines 2-7). Translation MUST preserve those verbatim.
- All 13 files are tracked in git.

### 1.2 `docs/analysis-2026-06-23/`

- Currently untracked on `main`; the directory was added in worktree `codex/059-methodology-lint-coverage` on 2026-06-24 as part of Spec #059's deliverables (the analysis that motivated #059).
- Once Spec #059 merges, the directory becomes tracked on `main`.
- The directory contains 14 Markdown files totaling ~96 KB (similar shape to 06-10).
- Content is almost entirely Arabic (recent Technical Advisor analysis).
- Translation work on this directory MUST start only after #059 merges.

### 1.3 `docs/project-analysis/2026-06-07/`

- 2 Markdown files tracked in git: `README.md` and `remediation-program.md`.
- Both files are **already in English**. The first lines of `README.md` state: "This report is written in English because Tempot Constitution Rule I requires…".
- The Spec #059 seed allowlist entry for this directory's pattern is therefore a misclassification.
- Action: remove the allowlist entry. No content change is required.

## 2. Translation Methodology

### 2.1 Fidelity standard

- Heading hierarchy preserved (H1 → H1, H2 → H2, etc.).
- Table column count, row count, and column header semantics preserved.
- Identifiers preserved exactly: `ISS-NNN`, `T-NNN`, `Spec #NNN`, `Rule X`, `ADR-NNN`, `EC-NNN`.
- Numeric figures (counts, percentages, sizes, deadlines) preserved.
- File paths and code references preserved.
- Cross-references between files preserved (using English link text but the same target anchor).
- English "Status update" notes preserved verbatim.

### 2.2 Verification per file

After each translation:

1. `grep -P '[\p{Arabic}]' <file>` returns zero matches.
2. Heading count: `grep -cE '^#+ ' <file>` matches the pre-translation count.
3. Table count: `grep -cE '^\|.*\|$' <file>` matches the pre-translation count.
4. Identifier list extraction (`grep -oE 'ISS-[0-9]+|T-[0-9]+|Spec #[0-9]+|Rule [IVXLCDM]+|ADR-[0-9]+|EC-[0-9]+' <file> | sort -u`) matches the pre-translation list.
5. `pnpm docs:check` passes.

### 2.3 Translation rules

- Headings: translate text but keep the heading marker (`#`) count.
- Tables: translate cell content; do NOT change column count or order.
- Lists: translate item text; do NOT change list marker style (preserve `-` vs `*` vs `1.`).
- Code blocks and inline code: do NOT translate content inside backticks; only translate the prose around them.
- Identifiers: keep exact characters (case, hyphens, numbers).
- File paths: preserve verbatim.

### 2.4 Volume estimates

- 27 files × ~7 KB average ≈ 190 KB of prose to translate.
- Estimate: 1.5–2 hours per directory at disciplined translation speed (preserving fidelity is the time-consumer, not the prose itself).

## 3. Tooling Verification

- `pnpm methodology:lint` will be added by Spec #059's execution; not yet present on `main`. Spec #061 execution starts after that.
- `pnpm docs:check` exists and is exercised by `apps/docs` tooling; verified on `main`.
- `pnpm spec:validate` exists and is used at end of specification phase.

## 4. Rule References (Constitution v2.5.x)

- **Rule I** (No Bypass): all developer-facing documentation MUST be in English.
- **Rule XL** (Language Policy): the audit Spec #059 implements; this spec drains its allowlist.
- **Rule LXXXIV** (Reporting and Stopping): each commit ends with a status report.
- **Rule LXXXV** (Single Active Spec): execution blocked until #058 and #059 merge.

## 5. Alternatives Considered

### 5.1 Delete the analyses instead of translating

- Rejected. The Project Manager's earlier "do not delete" instruction applies. Translation preserves history.

### 5.2 Keep both Arabic and English copies (parallel translation)

- Rejected (Q8). Two copies leaves the Arabic copy in the working tree, still violating Rule XL. Git history preserves the Arabic version forever; that is sufficient.

### 5.3 Translate only the executive summaries

- Rejected. Each directory's allowlist entry covers the whole directory; partial translation cannot drain the entry.

### 5.4 Move the analyses to an archive directory exempt from Rule XL

- Rejected. Creating a permanent archive exemption sets a precedent that other Arabic content could exploit. Translation closes the issue cleanly.

### 5.5 Translate file-by-file or directory-by-directory commits

- Resolved as file-by-file (Q7). Per-file commits maximize review clarity and allow safe pause-resume.

## 6. Open Questions Surfaced for Spec #059

| # | Question                                                                                          | Likely owner |
| - | ------------------------------------------------------------------------------------------------- | ------------ |
| 1 | Should the seed allowlist generator (or static seed list) be amended to exclude `docs/project-analysis/2026-06-07/`? | Spec #059 maintenance |
| 2 | Should the meta-linter offer a `dry-run` mode that lists files matching a category but not yet allowlisted, so future seed regeneration catches misclassifications? | Future enhancement |

## 7. Confidence

- FR-001 (analysis-2026-06-10/): high confidence; mechanical translation with verification gates.
- FR-002 (analysis-2026-06-23/): high confidence; same shape, depends on #059 merge timing.
- FR-003 (project-analysis/2026-06-07/): high confidence; one-line allowlist edit.
- FR-004 (evidence): high confidence; standard `--format=json` snapshot capture.
