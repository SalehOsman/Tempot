# 03 - Code Quality Analysis

## Summary

General code quality is good. The repository passes lint, build, unit tests, boundary checks, authorization checks, source conformance, and module checklist validation. The biggest code-quality problems are concentrated in docs ingestion semantics, operational scripts, and stale/ignored configuration.

## Confirmed Findings

| ID | Finding | Severity | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| CQ-001 | Partial docs ingestion can be treated as full success. | High | `packages/ai-core/src/content/content-ingestion.service.ts:91`, `apps/docs/scripts/ingest-runner.ts:107-170`. | RAG can skip files whose embeddings are incomplete. | Require all chunks to store successfully before saving hash. |
| CQ-002 | Sync docs discovery returns empty list. | Medium | `apps/docs/scripts/ingest-docs.ts:34-39`. | Any sync caller sees no docs. | Implement it or remove it from public surface. |
| CQ-003 | Webhook manager disables lint rules. | Medium | `apps/bot-server/scripts/webhook-manager.ts:1-2`. | Allows complexity and console handling to bypass normal rules. | Refactor script and remove file-level disables. |
| CQ-004 | Webhook manager has fallback secret. | High | `apps/bot-server/scripts/webhook-manager.ts:17`. | Weak secret can be used accidentally. | Require explicit secret outside local test mode. |
| CQ-005 | pnpm policy lives in an ignored location. | High | `package.json:91-104`, repeated pnpm warning. | Dependency policy may not apply. | Move policy to supported workspace config. |
| CQ-006 | Active architecture doc has language/encoding debt. | High | `docs/architecture/tempot_architecture.md` is allowlisted and contains non-English/mojibake text. | Maintainers and AI retrieval receive poor source-of-truth context. | Rewrite in English UTF-8. |

## Positive Evidence

| Quality control | Result |
|---|---|
| `pnpm lint` | Passed. |
| `pnpm build` | Passed on rerun. |
| `pnpm build:bot-runtime` | Passed. |
| `pnpm test:unit` | Passed, 2584 tests. |
| `pnpm boundary:audit` | Passed, 1096 files checked. |
| `pnpm authorization:check` | Passed, 9 modules checked. |
| `pnpm module:checklist` | Passed, 9 modules checked. |
| `pnpm source:conformance` | Passed. |

## Maintainability Risks

| Risk | Severity | Explanation |
|---|---|---|
| Large generated docs corpus without explicit RAG policy. | High | Future AI behavior can drift because raw file volume dominates retrieval. |
| Allowlist entries can normalize exceptions. | High | A passing methodology gate is less meaningful if exceptions remain broad. |
| Historical docs moved without allowlist update. | High | Governance tooling now fails on stale path assumptions. |
| Docs ingestion has mixed script/runtime responsibilities. | Medium | `ingest-docs.ts` contains CLI, hashing, discovery, parsing, metadata, and ingestion helper logic. |

## Recommendations

| Priority | Recommendation |
|---|---|
| P1 | Make docs ingestion strict for chunk failures. |
| P1 | Fix pnpm policy placement. |
| P1 | Remove webhook fallback secret. |
| P1 | Burn down methodology allowlist and moved historical docs drift. |
| P2 | Split docs ingestion helpers into discovery, metadata, hashing, CLI, and write-mode modules. |

