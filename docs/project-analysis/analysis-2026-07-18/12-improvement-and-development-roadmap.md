# 12 - Improvement And Development Roadmap

## Stage 1 - Stabilization

Goal: make current work safe to continue.

| Workstream | Tasks | Output |
|---|---|---|
| Production evidence | Staging smoke, monitoring, rollback, backup/restore, final go/no-go. | Release evidence package. |
| Test reliability | Fix integration and coverage timeouts. | Deterministic local/CI gates. |
| Dependency policy | Move ignored pnpm policy. | No pnpm warning; effective overrides/audit policy. |
| Webhook safety | Remove fallback secret. | Safer operational script. |

## Stage 2 - Documentation And RAG Foundation

Goal: make documentation useful as AI context.

| Workstream | Tasks | Output |
|---|---|---|
| Corpus manifest | Classify docs by language, audience, type, source-of-truth, freshness, priority. | RAG-ready manifest. |
| Source-of-truth cleanup | Rewrite architecture doc, mark old analysis as archived/stale. | Better retrieval ground truth. |
| Generated reference strategy | Weight or filter TypeDoc reference docs. | Reduced retrieval noise. |
| Link/citation quality | Add rendered link checker and citation tests. | Reliable RAG citations. |

## Stage 3 - RAG Quality Gates

Goal: prove AI answers are grounded, current, and safe.

| Workstream | Tasks | Output |
|---|---|---|
| Golden fixtures | Track and expand fixtures. | Stable RAG regression tests. |
| No-context behavior | Test abstention when context is missing. | Lower hallucination risk. |
| Stale-context behavior | Ensure old analysis docs do not override roadmap/spec truth. | Correct authority handling. |
| Role-based retrieval | Test developer-docs, db-schema, user-memory, and custom-knowledge access. | Access-safe retrieval. |

## Stage 4 - Production Readiness

Goal: reach evidence-backed release decision.

| Workstream | Tasks | Output |
|---|---|---|
| Operations docs | Deployment, rollback, incident, backup/restore, env contract. | Operator-ready runbooks. |
| Monitoring | Health/readiness, alert tests, dashboard evidence. | Observable runtime. |
| Release review | Zero Critical and no unapproved High findings. | Final go/no-go record. |

## Stage 5 - Scaling And Advanced Features

Goal: build on a stable base.

| Workstream | Tasks | Output |
|---|---|---|
| RAG performance | Index size, chunk counts, retrieval latency, cache strategy. | RAG performance budget. |
| Runtime AI activation | Governed module opt-in with degradation mode. | First production-safe AI flow. |
| Load testing | Webhook, queue, cache, vector search load smoke. | Scaling evidence. |

## 30 / 60 / 90 Day Plan

| Period | Focus | Deliverables |
|---|---|---|
| First 30 days | Stabilization, production evidence, test reliability, pnpm policy, webhook security. | Release blockers removed or explicitly documented. |
| Days 31-60 | Documentation/RAG corpus cleanup, architecture rewrite, allowlist burn-down, link checker. | RAG-ready documentation foundation. |
| Days 61-90 | RAG quality gates, runtime AI activation, performance budgets, scaling evidence. | Production-grade RAG and operational maturity. |

