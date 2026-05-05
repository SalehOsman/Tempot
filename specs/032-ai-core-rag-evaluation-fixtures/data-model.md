# Data Model: AI Core RAG Evaluation Fixtures

**Feature**: 032-ai-core-rag-evaluation-fixtures
**Date**: 2026-05-05

## No New Persistent Entities

This spec adds no database tables, Prisma models, Drizzle schemas, migrations, queues, or
runtime services. All models are TypeScript-only test data shapes under `packages/ai-core/tests/`.

## Test-Only Data Shapes

### RAGEvaluationFixture

Represents one deterministic evaluation case.

```typescript
interface RAGEvaluationFixture {
  id: string;
  title: string;
  request: RetrievalRequest;
  searchResults: readonly EmbeddingSearchResult[];
  expectation: RAGEvaluationExpectation;
}
```

### RAGEvaluationExpectation

Defines what the runtime outcome and answer state must contain.

```typescript
interface RAGEvaluationExpectation {
  selectedBlockIds: readonly string[];
  rejectedBlockIds: readonly string[];
  citationBlockIds: readonly string[];
  forbiddenBlockIds: readonly string[];
  answerState: RAGAnswerStatus;
  messageKey?: string;
}
```

### RAGEvaluationScore

Returned by the helper for assertions.

```typescript
interface RAGEvaluationScore {
  retrievalHit: boolean;
  citationCoverage: boolean;
  leakageDetected: boolean;
  noContextCorrect: boolean;
  missingSelectedBlockIds: readonly string[];
  missingCitationBlockIds: readonly string[];
  leakedBlockIds: readonly string[];
}
```

## Evaluation Rules

| Metric | Pass condition |
| --- | --- |
| Retrieval hit | Every expected selected block id appears in `RetrievalOutcome.selectedBlockIds` |
| Citation coverage | Every expected citation id appears in `RAGAnswerState.citations`, and each citation id was selected |
| Leakage | No forbidden block id appears in selected ids or citation ids |
| No-context correctness | No-context fixtures return state `no-context` with the expected i18n message key |

## Fixture Catalog Minimum

| Fixture | Purpose | Expected state |
| --- | --- | --- |
| `authorized-hit` | Authorized `ui-guide` content is selected and cited | `answered` |
| `citation-coverage` | Multiple selected blocks require full citation coverage | `answered` |
| `leakage-prevention` | Unauthorized `user-memory` or `custom-knowledge` candidates are rejected | `answered` |
| `no-context` | Empty or fully rejected candidates produce no-context state | `no-context` |

## Runtime Flow Under Test

```text
RAGEvaluationFixture
  -> fake EmbeddingService.searchSimilar()
  -> RAGPipeline.retrieveWithPlan(fixture.request)
  -> buildAnswerState(outcome)
  -> evaluateRAGFixture(outcome, answerState, fixture.expectation)
  -> RAGEvaluationScore
```
