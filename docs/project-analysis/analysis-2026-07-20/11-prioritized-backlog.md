# 10 - Prioritized Backlog

This document presents the prioritized technical backlog of remaining tasks required to stabilize the codebase, satisfy security requirements, and clear the project for production release.

---

## 1. Prioritized Technical Backlog

| Priority | Issue / Task | Type | File / Path | Impact | Solution | Effort |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **P0** | Incomplete operational staging evidence. | Operational | `docs/ROADMAP.md` | Releases cannot be cleared without staging proof. | Deploy latest signed Docker digest to staging, configure Cloudflare quick tunnel, verify webhook message delivery, backup database, and restore to replica. | **L** |
| **P0** | Spec #054 sensitive data protection cutover. | Security | `docs/ROADMAP.md` | Data encryption key-rotation is unverified in staging. | Run AES-256 key rotation rehearsal on staging database and document outcomes. | **M** |
| **P1** | Developer text in Arabic (Rule XL debt). | Governance | `modules/user-management/**`, `packages/input-engine/**` | Code readability, linter dependency, and constitution non-compliance. | Translate all Arabic code comments and template code tokens to English. | **M** |
| **P1** | Methodology allowlist burn-down. | Governance | `scripts/ci/methodology-lint.allowlist.json` | 26 active exceptions weaken automated lint validity. | Systematically refactor, translate, or archive the allowlisted files to remove entries. | **L** |
| **P2** | Insecure request body memory buffering. | Security | `apps/bot-server/src/server/hono.factory.ts` | Server is susceptible to OOM DoS attacks via huge request streams. | Configure Hono request body size limit middleware (e.g., limit to 10MB). | **S** |
| **P2** | Rate limit bypass or collision. | Security / Ops | `apps/bot-server/src/server/hono.factory.ts` | Proxy misconfiguration causes all users to collide on `'unknown-client'` rate limiting. | Validate trusted proxy IP headers (`X-Forwarded-For`) in production mode. | **S** |
| **P2** | Ingestion of stale project analysis files into RAG. | AI / RAG | `apps/docs/scripts/doc-discovery.ts` | AI retrieved answers can cite fixed bugs as current status. | Exclude `docs/project-analysis/**` from RAG ingestion or respect an `archived: true` frontmatter flag. | **S** |
| **P2** | Complete AI/RAG bot runtime activation. | Feature | `docs/ROADMAP.md` | No active bot modules expose AI RAG features to users yet. | Wire `@tempot/ai-core` RAG retrieval to a business module with `hasAI: true` and fallback mode. | **M** |
| **P2** | Astro build Pagefind indexing warnings. | Developer Exp. | `apps/docs/` (build logs) | Deprecation and 404 indexing errors clutter build outputs. | Update `astro.config.mjs` and Pagefind configuration to resolve build noise. | **S** |
| **P3** | Local developer credential security. | Operations | Local `.env` | Workstation security exposure of keys. | Create local credential rotation guidelines and rotate keys periodically. | **XS** |

---

## 2. Effort Categorization Guide

* **XS (Extra Small):** Less than 1 hour. Simple configuration changes.
* **S (Small):** 1 to 4 hours. Local code tweaks, single-file edits, minor test writing.
* **M (Medium):** About 1 work day. Requires architectural validation, staging runbook execution, or multiple test files.
* **L (Large):** 2 to 5 days. Complex multi-system execution, environment deployments, or large refactorings.
* **XL (Extra Large):** More than 1 week. Major sub-system changes or architectural re-engineering (none currently in backlog).
