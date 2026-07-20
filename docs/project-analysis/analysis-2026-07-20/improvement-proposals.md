# Tempot Improvement Proposals - 2026-07-20

This document tracks professional improvement proposals (IP-001 through IP-010) converted from project analysis findings, highlighting resolved items and remaining work.

---

## Proposal Index

| ID | Proposal | Priority | Primary Owner | Expected Impact | Status (as of 2026-07-20) |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **IP-001** | Production evidence closure program | P0 | TPM + DevSecOps | Converts production readiness into auditable evidence. | **ACTIVE / OPEN** |
| **IP-002** | Integration and coverage reliability sprint | P0/P1 | QA/Test Lead | Restores confidence in release gates. | **RESOLVED / COMPLETED** |
| **IP-003** | pnpm dependency-policy correction | P1 | DevSecOps | Ensures dependency overrides and audit policy are effective. | **RESOLVED / COMPLETED** |
| **IP-004** | Methodology allowlist burn-down | P1 | Technical Advisor | Reduces constitutional debt and governance ambiguity. | **ACTIVE / OPEN** (26 remaining) |
| **IP-005** | Architecture documentation rewrite | P1 | Senior Architect | Makes the active source of truth usable. | **RESOLVED / COMPLETED** |
| **IP-006** | Webhook operations hardening | P1 | Backend Engineer | Removes weak defaults and improves webhook safety. | **RESOLVED / COMPLETED** |
| **IP-007** | Secret scanning implementation | P1 | DevSecOps | Reduces risk of future credential leaks. | **RESOLVED / COMPLETED** |
| **IP-008** | Request-size and trusted-proxy hardening | P2 | Backend Engineer | Reduces edge-case DoS and rate-limit attribution risk. | **ACTIVE / OPEN** |
| **IP-009** | Docs build and Astro warning cleanup | P2 | Platform Engineer | Improves developer feedback and upgrade readiness. | **ACTIVE / OPEN** |
| **IP-010** | AI/RAG bot runtime activation | P2 | TPM + Backend | Aligns feature claims with runtime proof. | **ACTIVE / OPEN** |

---

## Resolved & Completed Proposals

### IP-002: Integration and Coverage Reliability Sprint
* **Resolution:** Fixed local Vitest configuration timeouts. `pnpm test:integration` and `pnpm test:coverage` now execute cleanly in CI and local environments.

### IP-003: pnpm Dependency-Policy Correction
* **Resolution:** Moved pnpm overrides and audit config out of root `package.json` and into `pnpm-workspace.yaml`. The root warnings are fully resolved.

### IP-005: Architecture Documentation Rewrite
* **Resolution:** `docs/architecture/tempot_architecture.md` has been rewritten in clean, English-only ASCII, and removed from the language policy allowlist.

### IP-006: Webhook Operations Hardening
* **Resolution:** Webhook manager script was refactored, the fallback secret token was deleted, and explicit environment checks are enforced.

### IP-007: Secret Scanning CI
* **Resolution:** Gitleaks scanning was added directly to `.github/workflows/ci.yml` running on all PR branches with `fetch-depth: 0`.

---

## Active Proposals

## IP-001: Production Evidence Closure Program

| Field | Detail |
| :--- | :--- |
| **Priority** | P0 (Release Blocker) |
| **Problem** | Live staging webhook updates, database rollback rehearsals, and Sentry monitoring proof remain open. |
| **Action** | Execute staging deployment using latest Cosign-signed candidate digest, run a Telegram update, and record logging/restore logs. |
| **Success Criteria** | dated logs for backup recovery, rollback command history, and webhook message processing in `docs/operations/evidence/`. |
| **Effort** | **L** (2-5 work days) |

---

## IP-004: Methodology Allowlist Burn-Down

| Field | Detail |
| :--- | :--- |
| **Priority** | P1 |
| **Problem** | The exception allowlist has 26 entries (Arabic comments, legacy specs) scheduled for remediation before expiration on 2026-10-09. |
| **Action** | Progressively refactor or translate components (e.g. `user-management` abilities, numeral helpers) to remove allowlist entries. |
| **Success Criteria** | `pnpm methodology:lint` passes with an empty exception array. |
| **Effort** | **L** (2-5 work days) |

---

## IP-008: Request-Size And Trusted-Proxy Hardening

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 |
| **Problem** | Lack of request size limits in Hono factory (OOM risk) and potential rate-limit client collision on `'unknown-client'` string. |
| **Action** | Configure Hono `bodyLimit` middleware (10MB) and validate proxy trust headers before parsing rate limit identifiers. |
| **Success Criteria** | Requests exceeding limit reject immediately, and IP extraction parses proxy headers correctly. |
| **Eff effort** | **S** (1-4 hours) |

---

## IP-010: AI/RAG Bot Runtime Activation

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 |
| **Problem** | AI RAG ingestion pipeline and database embeddings exist, but no user-facing Telegram bot flow consumes RAG retrieval. |
| **Action** | Wire `@tempot/ai-core` retrieval calls to a business module (e.g. `help-center` or custom module) with an AI fallback mode. |
| **Success Criteria** | Bot responds to general questions using documentation citations, and passes access-leakage test fixtures. |
| **Effort** | **L** (2-5 work days) |
