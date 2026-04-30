# Data Model: AI Core RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30

## No New Persistent Entities

This spec adds no new database tables, Prisma models, or Drizzle schemas.
All data shapes are TypeScript-only contracts defined in Spec #030.

## Runtime Data Flow

```text
RetrievalRequest
  └─> validateRetrievalRequest()          — contract validation (Spec #030)
        └─> RetrievalPlanBuilder.build()  — builds default RetrievalPlan
              └─> validateRetrievalPlan() — contract validation (Spec #030)
                    └─> RetrievalPlanExecutor.execute()
                          ├─> step: vector         — EmbeddingService.searchSimilar()
                          ├─> step: access-filter  — filters results by userScope
                          └─> step: context-assembly — maps results to block ids
                    └─> RetrievalOutcome           — selected ids, rejected ids, timings
              └─> RAGPipeline.buildAnswerState()
                    └─> RAGAnswerState             — answered / no-context / degraded
```

## Default Plan Shape Built by RetrievalPlanBuilder

```typescript
{
  planId: string,          // crypto.randomUUID()
  requestId: string,       // from RetrievalRequest
  createdAt: string,       // ISO timestamp
  policy: {
    requireAccessFilter: true,
    allowDegradedContext: false,
  },
  steps: [
    { id: 'step-vector',   kind: 'vector',          outputRef: 'vector-results',  required: true,  params: { limit, confidenceThreshold } },
    { id: 'step-access',   kind: 'access-filter',   outputRef: 'filtered-results', required: true,  params: { userScope } },
    { id: 'step-assembly', kind: 'context-assembly', outputRef: 'context',          required: true,  params: {} },
  ]
}
```

## RetrievalOutcome Shape (from Spec #030)

```typescript
{
  outcomeId: string,
  planId: string,
  selectedBlockIds: readonly string[],
  rejectedBlocks: readonly RetrievalRejectedBlock[],
  timings: readonly RetrievalStageTiming[],
  degraded: boolean,
}
```

## RAGAnswerState Decision Table

| selectedBlockIds.length | degraded | state       | citations          | messageKey                |
| ----------------------- | -------- | ----------- | ------------------ | ------------------------- |
| > 0                     | false    | answered    | mapped from blocks | undefined                 |
| > 0                     | true     | degraded    | empty              | `ai-core.rag.degraded`    |
| 0                       | false    | no-context  | empty              | `ai-core.rag.no_context`  |
| 0                       | true     | degraded    | empty              | `ai-core.rag.degraded`    |
