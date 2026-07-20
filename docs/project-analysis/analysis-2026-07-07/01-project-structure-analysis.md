# 01 - Project Structure Analysis

## Overview

The repository structure remains aligned with the documented Tempot architecture: applications live under `apps/`, reusable infrastructure under `packages/`, business capabilities under `modules/`, and SpecKit artifacts under `specs/`.

The main structural risk is not folder layout. The risk is source-of-truth drift: active documentation, historical documentation, local feature work, and roadmap state are not equally current.

## Root Structure

| Area | Current role | Status |
| --- | --- | --- |
| `apps/` | Runtime interfaces such as `bot-server` and the docs app. | Active and aligned. |
| `packages/` | Shared infrastructure and reusable services. | Active and broadly complete. |
| `modules/` | Business modules and module-owned domain logic. | Active; new `membership-management` exists locally but is not merged. |
| `specs/` | SpecKit source of truth. | Active; #057 open, #058 in execution, #059 specified but blocked. |
| `docs/` | Documentation, architecture, operations, product, and analysis records. | Useful but contains language and encoding debt. |
| `.specify/` | Constitution, roles, templates, active feature pointer. | Active authority. |
| `.github/` | CI and Docker publishing workflows. | Current `main` workflows are green. |

## Current Feature Context

`.specify/feature.json` points to:

```json
{
  "feature": "058-bot-access-mode-membership-gate",
  "feature_directory": "specs/058-bot-access-mode-membership-gate",
  "specPath": "specs/058-bot-access-mode-membership-gate/spec.md"
}
```

This is consistent with the local dirty workspace: most changes are related to bot access mode, membership-management, user-management approval handling, settings access-mode support, and tests.

## Documentation Structure

The documentation tree has both active and historical material:

- Active current docs: `docs/ROADMAP.md`, `docs/developer/`, `docs/architecture/`, `docs/operations/`, `docs/security/`.
- Historical or transitional docs: `docs/archive/`, `docs/development/`, `docs/prompt/`, `docs/code-review-2025-05-18/`, older analysis folders.
- Product docs: `docs/product/`, including English and Arabic product-facing content.

The constitution requires developer-facing documentation to be English. Product-facing Arabic docs may be legitimate if they are explicitly part of localized end-user documentation, but developer-facing Arabic analysis, plans, architecture, comments, and specs are documentation debt unless explicitly allowlisted by an approved enforcement spec.

## Strengths

- The three-layer architecture is visible in the repository layout.
- SpecKit artifacts are organized and traceable by feature number.
- The roadmap is still the declared source of truth for merged progress.
- Operations runbooks and evidence files exist for production-delivery work.
- ADRs are indexed and include recent delivery-hardening decisions.

## Weaknesses

- The previous `docs/analysis-2026-06-23/` snapshot is mostly Arabic and remains untracked in the local workspace.
- `docs/architecture/tempot_architecture.md` contains mojibake/Arabic legacy content and is not aligned with the English-only documentation rule.
- Several docs directories mix active guidance with historical or transitional records.
- New local Spec #058 documentation has not yet been reconciled into the roadmap and architecture docs because the implementation is incomplete.

## Conclusion

The project structure is sound. Documentation governance needs the next cleanup slice: classify active versus historical docs, translate or archive non-English developer-facing material, and enforce the rule through Spec #059 or a successor methodology-lint implementation.

