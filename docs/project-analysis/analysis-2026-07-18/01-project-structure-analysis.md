# 01 - Project Structure Analysis

## Repository Shape

| Area | Purpose | Assessment |
|---|---|---|
| `apps/bot-server/` | Telegram bot server and Hono runtime application. | Clear application boundary. |
| `apps/docs/` | Starlight/TypeDoc documentation app and docs ingestion scripts. | Strong platform, but RAG corpus quality needs work. |
| `packages/` | Shared infrastructure and domain engines. | Scalable monorepo package layer. |
| `modules/` | Business modules. | Good separation; module checklist passes. |
| `runtime/` | Runtime composition. | Supports modular activation. |
| `scripts/` | Governance, validation, generation, and ops automation. | Valuable, but some scripts carry allowlisted debt. |
| `specs/` | SpecKit artifacts. | Mature specification record. |
| `docs/` | Architecture, roadmap, developer docs, product docs, operations, archive, and analysis. | Extensive, but inconsistent for RAG and methodology. |

## Current Documentation Corpus Size

`docs/product` contains 2845 Markdown files. Segment distribution:

| Segment | Count | Interpretation |
|---|---:|---|
| `reference` | 2811 | Generated API reference dominates the RAG corpus. |
| `en` | 17 | Human-authored English product docs are limited. |
| `ar` | 5 | Arabic product docs are far smaller than English docs. |
| Other top-level segments | 12 | Mostly source-of-truth/support docs outside locale folders. |

## Structure Strengths

| Strength | Evidence |
|---|---|
| Monorepo boundaries are clear. | `apps`, `packages`, `modules`, `runtime`, `specs`, `docs`. |
| Package inventory is broad and modular. | `ai-core`, `database`, `logger`, `event-bus`, `auth-core`, `storage-engine`, `search-engine`, and others. |
| Business modules are separate from infrastructure packages. | `modules/*` are independent from `packages/*`. |
| Docs app exists as a first-class workspace. | `apps/docs/package.json` includes docs build, generate, validate, freshness, and ingest scripts. |

## Structure Weaknesses

| Problem | Severity | Evidence | Impact |
|---|---|---|---|
| Historical analysis folders appear moved into `docs/project-analysis/analysis-*` while git still records deletions from old locations. | High | `git status --short` shows deleted `docs/analysis-*` files and untracked `docs/project-analysis/analysis-*` files. | Methodology allowlist patterns no longer match and governance lint fails. |
| Documentation corpus mixes localized product docs, generated API reference, source-of-truth docs, and analysis docs without a RAG policy layer. | High | `docs/product` has 2811 generated reference files and only 22 localized product files. | Retrieval ranking can be dominated by generated API pages. |
| Active architecture source of truth is a single large document with language/encoding debt. | High | `docs/architecture/tempot_architecture.md` remains allowlisted. | Hard to maintain and poor RAG input quality. |
| `docs/product/reference` is outside `en/` and `ar/` locale roots. | High | Corpus count shows 2811 files under `reference`. | Current ingestion language detector marks it as `unknown`. |

## Reorganization Recommendations

| Recommendation | Priority | Reason |
|---|---|---|
| Create a RAG ingestion manifest that classifies docs by source, language, audience, freshness, and priority. | P1 | Prevents raw directory layout from controlling AI retrieval quality. |
| Move or map generated reference docs into explicit language/audience metadata. | P1 | Avoids `language=unknown` for most indexed content. |
| Normalize historical analysis folder locations and update allowlist patterns. | P1 | Restores methodology lint. |
| Split `docs/architecture/tempot_architecture.md` into smaller English UTF-8 architecture pages. | P1 | Improves maintainability and retrieval precision. |

