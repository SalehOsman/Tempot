# Research: AI Core RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30

## Problem Statement

Specs #029 and #030 added public TypeScript contracts for content blocks, retrieval plans,
and RAG answer states. These contracts are validated and exported but the existing
`RAGPipeline.retrieve` method does not use them at runtime. It accepts legacy `RetrieveOptions`,
calls `EmbeddingService.searchSimilar` directly, applies an ad-hoc role-based access matrix,
and returns a plain `RAGContext` string. The contracts have no effect on execution.

This spec wires the contracts into runtime behavior without breaking existing callers.

## Key Design Decisions

### D1: Add new method, do not replace old one

Adding `retrieveWithPlan` as a new method preserves the existing `retrieve` signature.
`TelegramAssistantUI` and `IntentRouter` call `retrieve`; modifying their callers is a
separate migration spec.

### D2: Build the default plan inside RAGPipeline, not in callers

Callers should not need to construct a `RetrievalPlan` manually for the common case.
`RAGPipeline.retrieveWithPlan` builds a default plan from the request internally. Advanced
callers can construct custom plans and pass them to the executor directly if needed later.

### D3: Extract builder and executor into separate files

`rag-pipeline.service.ts` already contains 60+ lines. Adding plan building and step execution
inline would exceed the 200-line rule. Two focused files keep each under the limit and allow
independent unit testing.

### D4: Access filter enforced by executor, not by caller

The executor is responsible for running the access-filter step before context assembly.
This matches the Spec #030 validation rule: a plan missing an access-filter step before
context-assembly is rejected before execution even starts.

### D5: EmbeddingSearchResult used as the block identity source

Physical `ContentBlock` rows do not exist yet. The executor maps `EmbeddingSearchResult.contentId`
to block ids in the outcome. This preserves compatibility until full content block persistence
is implemented in a future spec.

### D6: AuditService is an optional dep

Not all pipeline usages have an audit service available. Making it optional keeps the pipeline
usable in lightweight contexts (CLI tools, tests) without wiring the full audit chain.

### D7: messageKey values are i18n keys

All `messageKey` strings in RAGAnswerState use dot-notation i18n keys such as
`ai-core.rag.no_context` and `ai-core.rag.degraded`. They are never user-facing strings.

## What This Spec Does Not Do

- Does not activate `search-engine`, `document-engine`, or `import-engine`.
- Does not add lexical retrieval, relationship expansion, or reranking steps.
- Does not add physical `ContentBlock` table or schema changes.
- Does not migrate existing callers from `RetrieveOptions` to `RetrievalRequest`.
- Does not add evaluation fixtures or quality metrics (reserved for Spec #032).
