# 1. Executive Summary — AI Subsystem Verified Code Analysis

> **Auditing Role: Technical Project Manager & Code Auditor**
> **Date: July 31, 2026**
> **Baseline: Source Code of `@tempot/ai-core`, `apps/bot-server`, `modules/help-center`, `modules/knowledge-management`**

---

## 1.1 Overview & Verified Code Base

The Tempot AI subsystem is a purpose-built, 100% TypeScript-native AI framework providing:
- **Intent-Driven Bot Control**: Tool calling loop via `IntentRouter` (`packages/ai-core/src/router/intent.router.ts`) using Vercel AI SDK v6.
- **Constrained Knowledge RAG**: Role-based retrieval and grounding via `RAGPipeline` (`packages/ai-core/src/rag/rag-pipeline.service.ts`).
- **Pre-Execution CASL Protection**: Tool schema filtering via `CASLToolFilter` (`packages/ai-core/src/tools/casl-tool.filter.ts`).
- **Resilience Stack**: Cockatiel-backed Bulkhead, Circuit Breaker, Retry, and Timeout (`packages/ai-core/src/resilience/resilience.service.ts`).
- **Local & Cloud Provider Support**: Open-source local embeddings via Ollama/EmbeddingGemma (`ollama-embedding.client.ts`) alongside cloud LLMs (Gemini, OpenAI, DeepSeek).

The codebase comprises **46 source files** under `packages/ai-core/src/` and **31 unit test files** (214+ test cases) under `packages/ai-core/tests/unit/`.

---

## 1.2 Recent Progress & Verified Capabilities

The code review confirms the following recent implementations:
1. ✅ **Ollama & EmbeddingGemma Integration**: Fully implemented in `ollama-embedding.client.ts` and `text-embedding.provider.ts`, enabling local, zero-cost vector indexing.
2. ✅ **Language-Aware RAG Filtering**: Implemented in `apps/bot-server/src/startup/help-ai-context-quality.ts` via `preferredLanguageSources()` boosting user language ('ar'/'en') with fallback to cross-language (`0.45` confidence threshold).
3. ✅ **Localized Product Indexing**: `markdown-path-profile.ts` segments product docs into `localized-product` with priority `70` for 'ar' and 'en'.
4. ✅ **Smart Failure Rendering**: `ask.command.ts` and `help-assistant-response.service.ts` dynamically map error codes (`quota_exceeded`, `timeout`, `no_context`) to localized i18n keys.
5. ✅ **Local Product Index Build**: Vector indexing confirmed functional in local environment.
6. ✅ **Spec #066 Status**: Implemented (Needs production evidence) - profiles defined in `knowledge-source-profiles.ts:21` (`product`, `operations`, `architecture`, `analysis`, `full-project`), custom profiles store present, and background tests are present.

---

## 1.3 Strict Issue Classification & Priority Re-Evaluation

Findings are classified into 5 strict categories:
- **[Real Code Bug]**: Proven defect in code logic or resource lifecycle.
- **[Potential Risk]**: Works in current setup but introduces risk in multi-node/scaling scenarios.
- **[Documentation Gap]**: Mismatch between docs/specs and actual code implementation.
- **[Architectural Enhancement]**: Strategic improvement to codebase structure.
- **[Operational Note]**: Environment or configuration dependency.

### Summary Table of Core Findings

| ID | Location / File Path | Line / Component | Exact Code Finding | Classification | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **P1-01** | `apps/bot-server/src/startup/help-ai-assistant.provider.ts` | Line 63 | Excessive Per-Request Pool Creation / Connection Churn Risk. Note: `pool.end()` cleanup is present in `finally` blocks in `help-ai-assistant.provider.ts:63` and `knowledge-live-runtime.ts:77,123`, so there is NO unmanaged leak. | **[Real Code Bug]** | **P1 (High, NOT P0/Critical)** |
| **P1-02** | `packages/ai-core/src/resilience/resilience.service.ts` | Line 46 | Integration Gap: `resilience.service.ts:46` emits `system.ai.degraded`, but `deps.bot-factory.ts:59` only subscribes to `system.alert.critical`. No verified bridge exists. | **[Potential Risk]** | **P1 (High)** |
| **P1-03** | `packages/ai-core/src/router/intent.router.ts` | Line 145 | Appends RAG context to system prompt without XML boundary tags or injection scanning. | **[Potential Risk]** | **P1 (High)** |
| **P2-01** | `packages/ai-core/src/ai-core.config.ts` | Line 50 | `loadRateLimitConfig()` ignores `process.env` and returns static defaults (Config wiring). | **[Real Code Bug]** | **P2 (Medium)** |
| **P2-02** | `packages/ai-core/src/confirmation/confirmation.engine.ts` | Line 18 | Uses in-memory `Map` for state. Non-persisted across nodes (Redis Confirmation Engine). | **[Potential Risk]** | **P2 (Medium for single-node)** |
| **P2-03** | `packages/ai-core/src/embedding/embedding.service.ts` | Line 65 | Lacks batch embedding (`embedMany`), loops sequentially over chunks. | **[Architectural Enhancement]** | **P2 (Medium)** |
| **P2-04** | `packages/ai-core/src/router/intent.router.ts` | Line 80 | Uses synchronous `generateText()` without streaming (`streamText`). | **[Architectural Enhancement]** | **P2 (Medium)** |

> [!NOTE]
> Priorities Outline:
> - **P1**: Shared DB Pool, RAG Context Boundaries, Degradation Alert Bridge, Staging Evidence.
> - **P2**: Config wiring (`process.env`), Redis Confirmation Engine (P2 for single-node), Batch embedding, Streaming responses, Incremental hash ingestion.
> - **P3**: Hybrid search, Documentation sync.

---

## 1.4 Re-Evaluated Evaluation Scores

| Axis | Score | Rating | Rationale & Code Evidence |
| :--- | :---: | :--- | :--- |
| **AI Architecture** | 92% | Excellent | 46 modular files, 5 DI contracts, clean separation of concerns. |
| **Code Quality** | 90% | Excellent | 100% strict TS, 0 `any`/`ts-ignore`, `neverthrow` Result types. |
| **RAG Pipeline Design** | 88% | Excellent | Plan-based retrieval, role matrix, language-aware filtering (`help-ai-context-quality.ts`). |
| **Resilience & Fault Tolerance** | 90% | Excellent | Cockatiel 4-layer stack, fallback failure rendering in `help-center`. |
| **Security** | 88% | Excellent | Input-level CASL tool filtering (`casl-tool.filter.ts`), regex PII sanitization. |
| **Testing** | 88% | Excellent | 31 test files, 214+ unit cases, evaluation fixtures. |
| **Performance** | 76% | Good | Halfvec HNSW indexing (3072 dims), but unpooled DB connections in providers. |
| **Integration** | 80% | Good | `help-center` and `knowledge-management` wired; single factory pending. |
| **Observability** | 72% | Medium | Telemetry via Langfuse (`audit.service.ts`), missing latency dashboards. |
| **Spec & Doc Coverage** | 85% | Good | 10 specs, 6 ADRs, activation plan present; needs sync with code. |
| **Scalability** | 75% | Good | Solid single-node base; confirmation state needs Redis for multi-node. |
| **Developer Experience** | 80% | Good | Local Ollama/EmbeddingGemma support, CLI tooling available. |

### Composite Metric Summary

| Metric | Score | Interpretation |
| :--- | :---: | :--- |
| **AI Technical Score** | **84.5%** | High-quality engineering base backed by verified code. |
| **AI Production Readiness** | **75.0%** | Suitable for controlled staging and limited single-node pilot after P1 fixes and evidence collection. Not yet full production-ready. |
| **AI Maintainability** | **90.0%** | Outstanding DI design and strict typing. |
| **AI Risk Score** | **22.0%** | Low-Medium risk; risks are operational and easily remediated. |
