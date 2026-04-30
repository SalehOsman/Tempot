# Contract: Retrieval Planning Public API

**Feature**: 030-ai-core-retrieval-planning-and-grounding
**Date**: 2026-04-29

## Public Exports

`@tempot/ai-core` MUST export:

- `RetrievalRequest`
- `RetrievalPlan`
- `RetrievalStep`
- `RetrievalOutcome`
- `RetrievalRejectedBlock`
- `validateRetrievalRequest`
- `validateRetrievalPlan`
- `validateRetrievalOutcome`

## Validation Return Type

All validators return:

```ts
Result<T, AppError>
```

## Error Codes

- `ai-core.retrieval_request.invalid`
- `ai-core.retrieval_plan.invalid`
- `ai-core.retrieval_plan.access_filter_missing`
- `ai-core.retrieval_outcome.invalid`

## Boundary Rules

- The public barrel is the supported import path for consumers.
- This slice does not import from deferred packages.
- This slice does not execute search or generation.
- Access filtering is required by plan validation before context assembly.

## Step Ordering Rules

- Retrieval or filtering steps must occur before `context-assembly`.
- `access-filter` must occur before `context-assembly`.
- `relationship-expansion` must not run after `context-assembly`.
- `rerank` is optional but must run before `context-assembly` when present.
