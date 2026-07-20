# Tempot Improvement Proposals - 2026-07-17

This companion document converts the project analysis into concrete improvement proposals. It is intentionally action-oriented and scoped to the current evidence from the repository.

## Proposal Index

| ID | Proposal | Priority | Primary owner profile | Expected impact |
|---|---|---|---|---|
| IP-001 | Production evidence closure program | P0 | Technical Project Manager + DevSecOps | Converts production readiness into auditable evidence. |
| IP-002 | Integration and coverage reliability sprint | P0/P1 | QA/Test Lead + Principal Backend Engineer | Restores confidence in release gates. |
| IP-003 | pnpm dependency-policy correction | P1 | DevSecOps + Backend Engineer | Ensures dependency overrides and audit policy are effective. |
| IP-004 | Methodology allowlist burn-down | P1 | Technical Advisor + Code Reviewer | Reduces constitutional debt and governance ambiguity. |
| IP-005 | Architecture documentation rewrite | P1 | Senior Software Architect | Makes the active source of truth usable and constitution-compliant. |
| IP-006 | Webhook operations hardening | P1 | Backend Engineer + DevSecOps | Removes weak defaults and improves webhook safety. |
| IP-007 | Secret scanning and local secret hygiene | P1 | DevSecOps | Reduces risk of future credential leaks. |
| IP-008 | Request-size and trusted-proxy hardening | P2 | Backend Engineer | Reduces edge-case DoS and rate-limit attribution risk. |
| IP-009 | Docs build and Astro warning cleanup | P2 | Docs/Platform Engineer | Improves developer feedback and upgrade readiness. |
| IP-010 | AI/RAG activation evidence track | P2 | Product/Technical PM + Backend Engineer | Aligns feature claims with runtime proof. |

---

## IP-001: Production Evidence Closure Program

| Field | Detail |
|---|---|
| Priority | P0 |
| Problem | `docs/ROADMAP.md` still requires external staging smoke, monitoring/alert evidence, rollback rehearsal, backup/restore evidence, and final go/no-go review. |
| Business impact | Production approval cannot be defended without these artifacts. |
| Quick action | Create a release evidence checklist directly from `docs/ROADMAP.md` and assign each item an owner/date/artifact link. |
| Correct solution | Automate staging smoke, rollback, monitoring, and backup/restore evidence collection as part of release workflow. |
| Success criteria | Every production go/no-go item has dated evidence; no Critical or unapproved High findings remain. |
| Estimated effort | L |

### Deliverables

| Deliverable | Description |
|---|---|
| Staging smoke report | Signed image deployed to staging, webhook/container smoke completed, logs attached. |
| Monitoring evidence | Screenshots or exported alert-test artifacts proving readiness alerts fire. |
| Rollback rehearsal | Documented rollback run with timing, command history, and result. |
| Backup/restore proof | Target backup restored successfully and protected-data behavior verified. |
| Go/no-go record | Final decision document with unresolved risks and approvals. |

---

## IP-002: Integration And Coverage Reliability Sprint

| Field | Detail |
|---|---|
| Priority | P0/P1 |
| Problem | `pnpm test:integration` and `pnpm test:coverage` timed out locally after 244 seconds. |
| Business impact | Release readiness cannot depend on gates that hang or fail to produce evidence. |
| Quick action | Run integration tests with verbose reporter and per-file timing to identify the hanging suite. |
| Correct solution | Add deterministic container lifecycle, bounded test timeouts, and CI artifacts for failed/hung tests. |
| Success criteria | Both commands complete locally and in CI within a defined time budget. |
| Estimated effort | M |

### Recommended Work Plan

| Step | Action |
|---|---|
| 1 | Run integration with a single worker and verbose reporter. |
| 2 | Identify the last started test file before timeout. |
| 3 | Add explicit teardown for Testcontainers resources. |
| 4 | Add per-test and per-suite timeout budgets. |
| 5 | Publish logs and container diagnostics as CI artifacts. |

---

## IP-003: pnpm Dependency-Policy Correction

| Field | Detail |
|---|---|
| Priority | P1 |
| Problem | Current pnpm warns that the root `package.json#pnpm` field is ignored, including `overrides` and `auditConfig`. |
| Business impact | Security and dependency controls may be assumed active when they are not. |
| Quick action | Move policy into `pnpm-workspace.yaml` where supported and remove the stale root field. |
| Correct solution | Add a toolchain audit rule that fails on unsupported pnpm policy placement. |
| Success criteria | pnpm warning disappears; audit/override behavior is verified. |
| Estimated effort | S |

### Acceptance Checks

| Check | Expected result |
|---|---|
| `pnpm install --lockfile-only` or equivalent policy validation | No root `pnpm` warning. |
| `pnpm audit --audit-level=high` | Uses intended audit policy. |
| Toolchain audit | Fails if `package.json#pnpm` returns. |

---

## IP-004: Methodology Allowlist Burn-Down

| Field | Detail |
|---|---|
| Priority | P1 |
| Problem | `scripts/ci/methodology-lint.allowlist.json` has 28 active entries expiring on `2026-10-09`. |
| Business impact | A green methodology gate can hide real constitutional debt. |
| Quick action | Sort entries by source-of-truth impact and burn down architecture docs plus operational scripts first. |
| Correct solution | Replace broad exceptions with narrow, owner-bound, short-lived tasks. |
| Success criteria | Allowlist count drops materially; no active source-of-truth doc needs a language exception. |
| Estimated effort | M |

### Burn-Down Order

| Order | Area | Reason |
|---:|---|---|
| 1 | `docs/architecture/tempot_architecture.md` | Active source of truth; high onboarding impact. |
| 2 | `apps/bot-server/scripts/webhook-manager.ts` | Operational security relevance. |
| 3 | `modules/user-management/**` developer text | Active implemented module and future maintenance risk. |
| 4 | Historical analysis docs | Lower runtime risk; preserve only if needed as archived evidence. |

---

## IP-005: Architecture Documentation Rewrite

| Field | Detail |
|---|---|
| Priority | P1 |
| Problem | The active architecture document contains language/encoding debt and is allowlisted. |
| Business impact | New contributors and reviewers cannot rely on the main architecture source cleanly. |
| Quick action | Produce an English architecture summary with implementation evidence links. |
| Correct solution | Split the architecture into smaller English UTF-8 documents and connect them to the docs app navigation. |
| Success criteria | `pnpm docs:check` and `pnpm methodology:lint` pass without architecture-doc exception. |
| Estimated effort | L |

### Proposed Architecture Doc Set

| File | Purpose |
|---|---|
| `docs/architecture/overview.md` | System context and architecture principles. |
| `docs/architecture/runtime-composition.md` | Startup, bot runtime, module registry, health/readiness. |
| `docs/architecture/module-boundaries.md` | Module contracts, event bus, repository rules. |
| `docs/architecture/data-security.md` | Database, protected data, encryption, auth, logging redaction. |
| `docs/architecture/deployment.md` | Docker, CI, environments, release evidence. |

---

## IP-006: Webhook Operations Hardening

| Field | Detail |
|---|---|
| Priority | P1 |
| Problem | `apps/bot-server/scripts/webhook-manager.ts` uses file-level eslint disables and includes a fallback secret token. |
| Business impact | Operational mistakes can configure weak webhook security, and lint exceptions hide script complexity. |
| Quick action | Remove fallback secret and fail fast unless explicit env is present. |
| Correct solution | Refactor script into typed helpers, add validation tests, and remove eslint-disable comments. |
| Success criteria | Script has no file-level eslint disables and cannot run real operations with default secret. |
| Estimated effort | S |

### Required Tests

| Test | Expected result |
|---|---|
| Missing webhook secret in production mode | Script exits with clear error. |
| Local test mode with explicit opt-in | Script can use safe local-only behavior. |
| Invalid secret length/format | Script rejects configuration. |

---

## IP-007: Secret Scanning And Local Secret Hygiene

| Field | Detail |
|---|---|
| Priority | P1 |
| Problem | No confirmed secret-scanning CI workflow was observed. Local `.env` contains live secrets but is untracked. |
| Business impact | Future accidental secret commits may not be blocked early. |
| Quick action | Add gitleaks or trufflehog PR scanning with a baseline for placeholders. |
| Correct solution | Combine CI scanning, local preflight docs, and rotation playbooks. |
| Success criteria | PRs fail on real secrets; documented placeholders are explicitly baselined. |
| Estimated effort | S |

### Implementation Notes

| Topic | Recommendation |
|---|---|
| CI | Scan PR diff and repository history. |
| Local workflow | Add documented command for developers before pushing. |
| Baseline | Allow only intentional fake/example tokens with comments. |
| Rotation | Document immediate steps if a bot token/API key is exposed. |

---

## IP-008: Request-Size And Trusted-Proxy Hardening

| Field | Detail |
|---|---|
| Priority | P2 |
| Problem | `apps/bot-server/src/server/hono.factory.ts` reads no-content-length bodies into memory and falls back to `unknown-client` for rate-limit identity. |
| Business impact | Malformed requests can cause memory pressure; proxy misconfiguration can distort rate limiting. |
| Quick action | Document required proxy headers and reject missing client identity in production mode. |
| Correct solution | Use streaming request-size enforcement and explicit trusted-proxy configuration. |
| Success criteria | Tests prove oversized streamed requests are rejected without full buffering and proxy misconfiguration is detected. |
| Estimated effort | M |

---

## IP-009: Docs Build And Astro Warning Cleanup

| Field | Detail |
|---|---|
| Priority | P2 |
| Problem | Docs build succeeds but emits Astro markdown plugin deprecation warnings and a Pagefind warning: `Entry docs -> 404 was not found.` |
| Business impact | Build noise can hide future real warnings and complicate upgrades. |
| Quick action | Track warnings as docs platform debt. |
| Correct solution | Migrate deprecated markdown plugin config and fix Pagefind index entry. |
| Success criteria | Docs build completes without known warnings. |
| Estimated effort | S |

---

## IP-010: AI/RAG Activation Evidence Track

| Field | Detail |
|---|---|
| Priority | P2 |
| Problem | AI/RAG foundations exist, but roadmap evidence indicates runtime activation is not fully complete. |
| Business impact | Product claims may outrun actual runtime capability. |
| Quick action | Add a visible RAG status matrix: foundation, module opt-in, safety tests, staging smoke. |
| Correct solution | Complete governed module activation, safety fixtures, no-context tests, and staging evidence. |
| Success criteria | One governed module is active with AI behavior, degradation mode, and passing leakage/no-context tests. |
| Estimated effort | L |

---

## Recommended Execution Sequence

| Week | Focus | Expected outcome |
|---|---|---|
| Week 1 | IP-001, IP-002 investigation, IP-003 | Production blockers visible; pnpm warning removed; integration root cause identified. |
| Week 2 | IP-002 fix, IP-006, IP-007 | Reliable test gates, hardened webhook script, secret scanning active. |
| Week 3 | IP-004 first burn-down, IP-005 architecture rewrite start | Governance debt starts shrinking; architecture source becomes usable. |
| Week 4 | IP-001 final evidence, IP-008, release review | Production go/no-go can be evaluated with evidence. |
| Month 2 | Complete IP-004 and IP-005, address IP-009 | Documentation and governance debt materially reduced. |
| Month 3 | IP-010 and scaling/performance evidence | AI/RAG and scaling work proceed on a stable base. |

## Executive Recommendation

The highest return is not a broad refactor. The highest return is a focused production-readiness and governance-debt program: close release evidence, make test gates deterministic, fix ignored dependency policy, remove weak webhook defaults, add secret scanning, and rewrite the active architecture documentation. These changes are small compared with a rebuild, but they materially increase production safety and long-term maintainability.
