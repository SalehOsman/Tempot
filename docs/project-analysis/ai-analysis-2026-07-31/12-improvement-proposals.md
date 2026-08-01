# 12. Professional AI Improvement Proposals

> **Auditing Role: Senior AI/ML Engineer**
> **Scope: 10 actionable improvement proposals (IP-AI-01 through IP-AI-10) aligned with Harmonized Standards**

---

## Proposal Index

| ID | Proposal | Priority | Expected Impact | Effort | Status |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **IP-AI-01** | Global Database Connection Pool Reuse | P1 | Solves connection churn in `help-ai-assistant.provider.ts:63` and `knowledge-live-runtime.ts:77,123` | S | OPEN |
| **IP-AI-02** | RAG Context Delimiters & Injection Guard Instructions | P1 | Fixes `intent.router.ts:145` | S | OPEN |
| **IP-AI-03** | AI Degradation Alert Bridge | P1 | Connects `resilience.service.ts:46` to `deps.bot-factory.ts:59` (`system.ai.degraded` -> `system.alert.critical`) | S | OPEN |
| **IP-AI-04** | Staging Vector Write Evidence Harness | P1 | Ensure staging testability | S | OPEN |
| **IP-AI-05** | Environment Variable Wiring for Rate Limiter & Resilience | P2 | Fixes `ai-core.config.ts:50` | XS | OPEN |
| **IP-AI-06** | Redis Persistence Adapter for ConfirmationEngine | P2 | Fixes `confirmation.engine.ts:18` | S | OPEN |
| **IP-AI-07** | Batch Embedding (`embedMany`) Pipeline | P2 | Faster document ingestion | M | OPEN |
| **IP-AI-08** | Streaming RAG Responses (`streamText`) | P2 | Sub-second first token latency | L | OPEN |
| **IP-AI-09** | Incremental Content Hash Ingestion | P2 | Skips unchanged content | S | OPEN |
| **IP-AI-10** | AI Documentation Alignment | P3 | Keeps docs up to date | S | OPEN |

---

## IP-AI-01: Global Database Connection Pool Reuse

| Field | Detail |
| :--- | :--- |
| **Priority** | P1 (High) |
| **Problem** | Connection churn occurs in `help-ai-assistant.provider.ts:63` and `knowledge-live-runtime.ts:77,123`. |
| **Proposed Solution** | Implement global database connection pool reuse. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-02: RAG Context Delimiters & Injection Guard Instructions

| Field | Detail |
| :--- | :--- |
| **Priority** | P1 (High) |
| **Problem** | Missing context delimiters and injection guards at `intent.router.ts:145`. |
| **Proposed Solution** | Add RAG context delimiters and injection guard instructions. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-03: AI Degradation Alert Bridge

| Field | Detail |
| :--- | :--- |
| **Priority** | P1 (High) |
| **Problem** | Need connection from `resilience.service.ts:46` to `deps.bot-factory.ts:59` mapping `system.ai.degraded` to `system.alert.critical`. |
| **Proposed Solution** | Implement AI degradation alert bridge. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-04: Staging Vector Write Evidence Harness

| Field | Detail |
| :--- | :--- |
| **Priority** | P1 (High) |
| **Problem** | Missing harness for staging vector write evidence. |
| **Proposed Solution** | Create a staging vector write evidence harness. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-05: Environment Variable Wiring for Rate Limiter & Resilience

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 (Medium) |
| **Problem** | Environment variable wiring missing at `ai-core.config.ts:50`. |
| **Proposed Solution** | Wire environment variables for rate limiter & resilience. |
| **Effort** | **XS** (Extra Small effort) |

---

## IP-AI-06: Redis Persistence Adapter for ConfirmationEngine

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 (Medium) |
| **Problem** | Lack of persistence adapter at `confirmation.engine.ts:18`. |
| **Proposed Solution** | Add Redis persistence adapter for ConfirmationEngine. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-07: Batch Embedding (`embedMany`) Pipeline

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 (Medium) |
| **Problem** | Inefficient chunk-by-chunk embedding. |
| **Proposed Solution** | Implement batch embedding pipeline using `embedMany`. |
| **Effort** | **M** (Medium effort) |

---

## IP-AI-08: Streaming RAG Responses (`streamText`)

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 (Medium) |
| **Problem** | Lack of streaming delays response feedback. |
| **Proposed Solution** | Use `streamText` to stream RAG responses for better UX. |
| **Effort** | **L** (Large effort) |

---

## IP-AI-09: Incremental Content Hash Ingestion

| Field | Detail |
| :--- | :--- |
| **Priority** | P2 (Medium) |
| **Problem** | Full corpus re-ingestion is inefficient for small changes. |
| **Proposed Solution** | Introduce incremental content hash ingestion to skip unchanged content. |
| **Effort** | **S** (Small effort) |

---

## IP-AI-10: AI Documentation Alignment

| Field | Detail |
| :--- | :--- |
| **Priority** | P3 (Low) |
| **Problem** | Documentation can fall out of sync with AI implementation. |
| **Proposed Solution** | Ensure AI documentation remains aligned with source. |
| **Effort** | **S** (Small effort) |
