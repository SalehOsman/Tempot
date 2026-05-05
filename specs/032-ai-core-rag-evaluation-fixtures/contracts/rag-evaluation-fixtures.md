# Contract: RAG Evaluation Fixtures

**Feature**: 032-ai-core-rag-evaluation-fixtures
**Scope**: Test-only contract under `packages/ai-core/tests/`

## Fixture Contract

Each fixture must provide:

- Stable `id` and English developer-facing `title`.
- A valid `RetrievalRequest`.
- Fake `EmbeddingSearchResult` values returned by the test embedding service.
- Expected selected block ids.
- Expected rejected block ids.
- Expected citation block ids.
- Forbidden block ids that must never be selected or cited.
- Expected answer state and optional i18n message key.

## Helper Contract

The main helper function must accept one object parameter to respect the project parameter
limit.

```typescript
interface EvaluateRAGFixtureInput {
  outcome: RetrievalOutcome;
  answerState: RAGAnswerState;
  expectation: RAGEvaluationExpectation;
}

function evaluateRAGFixture(
  input: EvaluateRAGFixtureInput,
): Result<RAGEvaluationScore, AppError>;
```

## Required Metric Semantics

- `retrievalHit` is true only when all expected selected ids are present.
- `citationCoverage` is true only when all expected citation ids are present and each cited id
  exists in the selected set.
- `leakageDetected` is true when any forbidden id appears in selected ids or citation ids.
- `noContextCorrect` is true for non-no-context fixtures, and for no-context fixtures only when
  the answer state and message key match the expectation.

## Out-of-Scope Contract Items

- Natural-language answer grading.
- Latency, token, or cost scoring.
- CLI output format.
- Runtime package exports.
