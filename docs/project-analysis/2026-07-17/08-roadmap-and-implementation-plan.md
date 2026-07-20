# Roadmap And Implementation Plan

## Phase 1: Stabilization

Goal: fix release blockers and make production evidence reliable.

| Task | Priority | Estimate | Output |
|---|---|---:|---|
| Complete external staging webhook/container smoke. | P0 | 1-2 days | Dated staging smoke evidence. |
| Complete monitoring/alert evidence. | P0 | 1 day | Alert proof and runbook link. |
| Complete rollback rehearsal. | P0 | 1 day | Rollback evidence and recovery notes. |
| Complete backup/restore and protected-data evidence. | P0 | 1-2 days | Restore proof and key-rotation result. |
| Fix integration timeout. | P0 | 1 day | Passing integration gate. |
| Fix coverage timeout. | P1 | 1 day | Coverage summary artifact. |

Definition of Done:

| Criterion |
|---|
| All production go/no-go items have dated evidence. |
| `pnpm test:integration` completes reliably. |
| `pnpm test:coverage` completes reliably. |
| No unresolved Critical production-readiness findings remain. |

## Phase 2: Refactoring

Goal: reduce governance and maintainability debt.

| Task | Priority | Estimate | Output |
|---|---|---:|---|
| Move pnpm policy to supported config. | P1 | 0.5 day | No pnpm warning. |
| Refactor webhook manager. | P1 | 1 day | No file-level eslint disables and no fallback secret. |
| Burn down methodology allowlist. | P1 | 2-5 days | Smaller allowlist. |
| Rewrite architecture documentation. | P1 | 2-5 days | English UTF-8 architecture docs. |

Definition of Done:

| Criterion |
|---|
| Methodology checks pass with fewer exceptions. |
| Operational scripts comply with lint rules. |
| Architecture docs are clear, English, and implementation-backed. |

## Phase 3: Testing And Quality

Goal: expand high-risk test coverage and make gates deterministic.

| Task | Priority | Estimate | Output |
|---|---|---:|---|
| Add request body limit tests. | P2 | 0.5-1 day | Oversized/no-length bodies tested. |
| Add trusted proxy/rate-limit tests. | P2 | 0.5 day | Proxy identity behavior tested. |
| Add secret-scanning CI. | P1 | 0.5 day | PRs block real secrets. |
| Add release smoke artifacts. | P1 | 1-2 days | Repeatable release evidence. |

Definition of Done:

| Criterion |
|---|
| CI failures are diagnosable from artifacts. |
| Security checks cover dependencies, secrets, and containers. |
| Production-critical failure paths have regression tests. |

## Phase 4: Production Readiness

Goal: prepare controlled production operation.

| Task | Priority | Estimate | Output |
|---|---|---:|---|
| Finalize deployment runbook. | P1 | 1 day | Operator-ready runbook. |
| Finalize incident and rollback runbooks. | P1 | 1 day | Recovery procedures. |
| Verify production env contract. | P1 | 0.5 day | Required env checklist. |
| Run final go/no-go review. | P0 | 0.5 day | Signed production decision. |

Definition of Done:

| Criterion |
|---|
| Production deploy can be executed, observed, and rolled back from docs. |
| Required secrets and env vars are validated. |
| Final go/no-go decision is evidence-backed. |

## Phase 5: Scaling And Advanced Features

Goal: build on a stable base.

| Task | Priority | Estimate | Output |
|---|---|---:|---|
| Complete governed AI/RAG module activation. | P2 | 2-5 days | One runtime module with AI enabled and tested. |
| Add performance budgets. | P2 | 1-2 days | Build/start/test budgets. |
| Expand queue/cache observability. | P2 | 1-3 days | Dashboards and alerts. |
| Add webhook load smoke tests. | P2 | 1-3 days | Baseline scaling evidence. |

## 30 / 60 / 90 Day Plan

### First 30 Days

| Focus | Actions |
|---|---|
| Urgent fixes | Close production evidence gaps, fix integration/coverage timeouts, resolve pnpm warning, remove webhook fallback secret. |
| Required quality | Add secret scanning, validate Docker image smoke, verify backup/restore and rollback. |
| Basic tests | Add body-limit, trusted-proxy, and webhook-manager env validation tests. |
| Governance | Start allowlist burn-down with architecture doc and webhook script. |

### Days 31-60

| Focus | Actions |
|---|---|
| Refactoring | Clean operational scripts and reduce broad allowlist globs. |
| Documentation | Replace active architecture doc and add deployment/troubleshooting runbooks. |
| CI/CD | Add stronger release evidence artifacts. |
| Monitoring | Finish dashboard/alert documentation and rehearsal evidence. |

### Days 61-90

| Focus | Actions |
|---|---|
| Performance | Add build/test/startup budgets and runtime load smoke tests. |
| Scaling | Validate queue/cache/database behavior under expected growth paths. |
| Advanced features | Complete governed AI/RAG runtime activation and safety tests. |
| Production maturity | Run final production-readiness review with linked evidence. |

