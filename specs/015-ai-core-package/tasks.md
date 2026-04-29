# AI Core - Reconciled Task Status

**Feature:** 015-ai-core-package
**Source:** spec.md, plan.md, research.md, package implementation
**Reconciled:** 2026-04-29 by Spec #028
**Status:** Complete baseline; future RAG work must use follow-on specs.

## Purpose

This file replaces the obsolete generated task backlog that still presented the
completed `@tempot/ai-core` package as unfinished scaffolding work. It is now a
source-of-truth reconciliation artifact for future agents.

## Current Implementation Coverage

- [x] T001 Provider abstraction and configuration implemented for FR-001 and SC-001 in `packages/ai-core/src/provider/ai-provider.factory.ts` and `packages/ai-core/src/ai-core.config.ts`.
- [x] T002 Resilience, circuit breaker, retry, timeout, and degradation behavior implemented for FR-002, FR-017, SC-002, and SC-008 in `packages/ai-core/src/resilience/resilience.service.ts`.
- [x] T003 Embedding and vector search services implemented for FR-003, FR-010, FR-011, SC-003, and SC-006 in `packages/ai-core/src/embedding/embedding.service.ts` and `packages/ai-core/src/rag/rag-pipeline.service.ts`.
- [x] T004 Content ingestion and chunking implemented for FR-004, FR-012, FR-013, and SC-007 in `packages/ai-core/src/content/content-ingestion.service.ts` and `packages/ai-core/src/chunking/`.
- [x] T005 Tool registration, CASL filtering, intent routing, and confirmation gates implemented for FR-005, FR-006, FR-007, FR-008, FR-009, SC-004, and SC-012 in `packages/ai-core/src/tools/`, `packages/ai-core/src/router/`, and `packages/ai-core/src/confirmation/`.
- [x] T006 Conversation memory, alternative suggestions, and bot UI adapter implemented for FR-014, FR-015, FR-016, and SC-005 in `packages/ai-core/src/memory/`, `packages/ai-core/src/suggestions/`, and `packages/ai-core/src/ui/`.
- [x] T007 Developer assistant and module reviewer implemented for FR-018, FR-019, SC-009, and SC-011 in `packages/ai-core/src/cli/`.
- [x] T008 Output limiting, pagination, and input normalization follow-up work implemented for FR-020, FR-021, FR-022, FR-023, FR-024, and SC-010 in `packages/ai-core/src/tools/` and `packages/ai-core/src/pagination/`.

## Reconciliation Decisions

- [x] T009 Provider switching is documented and implemented through `TEMPOT_AI_PROVIDER`.
- [x] T010 Removed active guidance for the retired provider-refusal error code. Future safety-filter handling requires a new spec.
- [x] T011 Removed active guidance for the retired explicit AI degradation-mode type. Runtime resilience is handled by `ResilienceService`.
- [x] T012 Confirmation routing now returns an i18n response key and machine-readable callback status under Spec #028.

## Benchmark Coverage

- [x] T013 NFR-001 benchmark target `< 5s` remains a documented acceptance target for intent routing latency excluding external API latency.
- [x] T014 NFR-002 benchmark target `< 500ms` remains a documented acceptance target for embedding generation per chunk excluding external API latency.
- [x] T015 NFR-003 benchmark target `< 100ms` remains a documented acceptance target for vector similarity search up to 100K embeddings with HNSW indexing.
- [x] T016 NFR-005 benchmark target `< 1ms` remains a documented acceptance target for circuit breaker activation after threshold.
- [x] T017 NFR-006 benchmark target `< 3s` remains a documented acceptance target for conversation summarization per session.

## Verification Commands

Run these before changing this package:

```powershell
pnpm --filter @tempot/shared build
pnpm --filter @tempot/ai-core test
pnpm spec:validate
pnpm lint
git diff --check
```

## Next Work

New RAG execution must start from Spec #027 and a follow-on implementation spec.
Do not use this file as an unchecked implementation backlog.
