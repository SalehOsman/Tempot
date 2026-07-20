# 07 - Testing Review

This document audits the testing architecture, coverage policies, and quality gates for Tempot.

---

## 1. Current Testing Architecture

Tempot utilizes Vitest 4.1.0 and Testcontainers for its testing suite. The test layout complies with the constitutional **Test Pyramid (Rule XXXV)**, maintaining a split of 70% Unit, 20% Integration, and 10% End-to-End (E2E) tests.

### Test Type Breakdown:
* **Unit Tests (`pnpm test:unit`):** Validate services, mappers, helper scripts, and RAG chunking logic in isolation. 100% of the 2,627 unit tests pass.
* **Integration Tests (`pnpm test:integration`):** Leverage Testcontainers to spin up ephemeral PostgreSQL/pgvector and Redis services. These verify repository mappings, database queries, and session state persistence.
* **End-to-End Tests (`pnpm test:e2e`):** Simulate Hono HTTP endpoints and mock Telegram server callbacks to test the complete webhook payload pipeline.
* **Coverage policy:** `pnpm test:coverage` evaluates 117 governed components, asserting strict coverage boundaries per Rule XXXVI (Services: 80%, Handlers: 70%, Repositories: 60%).

---

## 2. Test Coverage & Gap Analysis

### Current Test Gaps

| Test Gap | Severity | Risk | Proposed Remediation |
| :--- | :---: | :--- | :--- |
| **No-Context AI Response** | High | AI could hallucinate when documentation context is missing. | Write a regression test verifying the RAG pipeline abstains when relevance scores are below the threshold. |
| **Staging Webhook Smoke** | High | Real Telegram updates might fail to parse on external staging URLs. | Implement a script that sends mock Telegram update payloads via staging endpoints. |
| **Rate Limiting Integration** | Medium | Spoofed IP proxy headers could bypass rate limits. | Create integration tests simulating header variations and asserting proper lockout. |
| **Link Validation Gate** | Medium | Stale documentation links could degrade Astro documentation builds. | Integrate a link-checking tool (e.g., `broken-link-checker`) into the `docs:check` pipeline. |

---

## 3. Practical Testing Plan

### 3.1. Critical Tests (To add immediately)
* **AI Hallucination Guard:** Validate that the RAG pipeline returns `Result.err(RAGError.noContext)` or localized fallback text when the search query returns zero matching documentation chunks.
* **Stale Context Exclusion:** Prove that the docs discovery scanner excludes legacy analysis directories (`docs/project-analysis/**`) from the generated corpus to prevent old bugs from being retrieved.

### 3.2. High Priority Tests
* **Staging Migration Rollback:** Create a staging automation check that executes database migrations, reverts them, and asserts database structure parity.
* **AES-256 Key Rotation:** Verify that when encryption key versions are updated in `.env`, the repository mapper still decrypts old records using the fallback key while writing new records with the active key.

### 3.3. Regression & Smoke Tests
* **Golden RAG Fixture:** Maintain and track `apps/docs/tests/integration/rag-golden-fixture.test.ts` to assert that core product queries return stable and correct document references.
* **Bot Startup Smoke Check:** Verify `/live` returns `200 OK` and `/ready` returns `503 Service Unavailable` if Redis or Postgres connections are severed.
