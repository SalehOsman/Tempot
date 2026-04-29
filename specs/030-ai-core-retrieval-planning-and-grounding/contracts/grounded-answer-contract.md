# Contract: Grounded Answer State Public API

**Feature**: 030-ai-core-retrieval-planning-and-grounding
**Date**: 2026-04-29

## Public Exports

`@tempot/ai-core` MUST export:

- `RAGAnswerState`
- `RAGAnswerStatus`
- `RAGAnswerCitation`
- `validateRAGAnswerState`

## Supported States

- `answered`
- `no-context`
- `degraded`
- `refused`

## Validation Return Type

The validator returns:

```ts
Result<RAGAnswerState, AppError>
```

## Error Codes

- `ai-core.rag.answer_invalid`
- `ai-core.rag.grounding_invalid`

## Grounding Rules

- `answered` states require at least one citation.
- Each citation must reference a content block id.
- `answered` states require confidence between 0 and 1.
- `no-context`, `degraded`, and `refused` states require an i18n message key.
- Non-answered states must not be counted as grounded answers.
