# 10 - Documentation Review

This document audits the quality, completeness, and structure of technical and product documentation, as well as its RAG (Retrieval-Augmented Generation) ingestion readiness.

---

## 1. Documentation Quality Assessment

Tempot maintains a large and active documentation corpus:

* **Architecture Reference:** `docs/architecture/tempot_architecture.md` (v12.0) has been fully rewritten in English UTF-8, resolving language and encoding debt.
* **Development Workflows:** `docs/developer/workflow-guide.md` and checklists (e.g., `package-creation-checklist.md`) are extremely comprehensive.
* **API Documentation:** Automatically generated via TypeDoc and hosted under `apps/docs` (Astro/Starlight).
* **Setup Instructions:** Covered in the root `README.md` and `docs/archive/QUICK-START.md`.

### Identified Shortcomings:
1. **Scattered Historical Analyses:** Previous analysis folders (`analysis-2026-06-10`, `analysis-2026-06-23`, etc.) are retained under `docs/project-analysis/`. Without exclusion rules, these files are indexed as current project status.
2. **Missing Ingestion manifest:** The RAG system relies on filesystem path detection to determine document metadata. A dedicated, explicit manifest is required to define document freshness and classification.
3. **No Automated Link Verification:** Astro builds generate routing files, but there is no CI gate validating that cross-document links (e.g., `[label](file://...)`) remain unbroken.

---

## 2. RAG Ingestion Readiness Review

Since the July 18 analysis, major improvements have been made to the RAG ingestion pipeline:

| RAG Axis | Pre-July 18 Status | Current Status (July 20) | Assessment |
| :--- | :--- | :--- | :--- |
| **Language Metadata** | 98% classified as `unknown` | All generated and human docs mapped to `en`/`ar` | **Resolved.** Metadata queries now support language filtering. |
| **Ingestion Completeness** | Partial chunk errors skipped | All chunks must succeed to write file hash | **Resolved.** Safe incremental indexing guaranteed. |
| **Discovery Logic** | Sync discovery returned empty | Proper sync search implemented | **Resolved.** Standard API for batch operators. |
| **Corpus Prioritization** | Reference docs dominated | Weighting policy ranks source-of-truth first | **Resolved.** High-level guides outrank raw APIs. |
| **Golden Fixture** | Untracked locally | Tracked as regression test in CI | **Resolved.** Verification guard is stable. |

---

## 3. Proposed Documentation Structure

To clean up legacy files and improve both developer onboarding and RAG retrieval precision, we propose reorganizing the documentation corpus into the following structure:

```text
docs/
├── architecture/         # System design, ADRs, and boundary contracts
│   ├── adr/              # Architectural Decision Records
│   └── tempot_architecture.md # Core English design spec
├── developer/            # Guides, checklists, and local setup scripts
├── operations/           # Deployment, backup, restore, and runbooks
├── product/              # Multi-lingual end-user product guides
│   ├── en/               # English product guides
│   └── ar/               # Arabic product guides
├── project-analysis/     # Audit snapshots (retained for verification)
└── archive/              # Stale/legacy planning artifacts (excluded from RAG)
```

### Next Steps for Documentation Governance:
* **Rule LX Parity:** Enforce that any code change must modify its corresponding specification or guide file, validated during the `pnpm docs:check` CI gate.
* **Archived Flag:** Mandate the use of frontmatter metadata `archived: true` for all files under `docs/project-analysis/` and `docs/archive/` so that RAG queries ignore them by default.
