# Research: AI Core RAG Evaluation Fixtures

**Feature**: 032-ai-core-rag-evaluation-fixtures
**Date**: 2026-05-05

## Problem Statement

Spec #031 connected the RAG runtime path to validated retrieval-plan and answer-state
contracts. The package can now return structured `RetrievalOutcome` and `RAGAnswerState`
values, but there is no deterministic fixture set that evaluates whether future changes keep
retrieval hits, citations, access filtering, and no-context behavior correct.

This spec creates the smallest useful evaluation layer: test-only fixtures, helpers, and unit
tests. It intentionally avoids a CLI or service because the approved scope is fixtures only.

## Key Design Decisions

### D1: Keep fixtures and helpers test-only

Fixtures live under `packages/ai-core/tests/fixtures/` and helpers under
`packages/ai-core/tests/helpers/`. This avoids changing runtime exports or creating new public
package surface area.

### D2: Use Spec #031 structured contracts as the evaluation input

The helper evaluates `RetrievalOutcome` and `RAGAnswerState`, not natural-language generated
answers. Structured contracts make the unit tests deterministic and avoid provider calls.

### D3: Measure the approved metric categories only

The MVP measures retrieval hit, citation coverage, unauthorized leakage, and no-context
correctness. Latency, token usage, and cost remain future dimensions because they require
runtime instrumentation or provider metadata outside the approved fixtures-only scope.

### D4: Model unauthorized leakage as forbidden block ids

Each fixture may declare `forbiddenBlockIds`. The helper checks both selected ids and citation
ids against that set. This catches both retrieval leakage and answer-state citation leakage.

### D5: Preserve no-context as a structured state

No-context correctness is evaluated through `RAGAnswerState.state === 'no-context'` and the
expected i18n `messageKey`. The tests do not parse user-visible text.

### D6: Avoid new dependencies

Vitest and neverthrow already exist in the package. The helper can use arrays, sets, and
existing Tempot error types without another library.

## Alternatives Rejected

### New CLI evaluator

Rejected because the Project Manager selected fixtures only and explicitly excluded a CLI.

### Runtime evaluator service

Rejected because a service would introduce production surface area, lifecycle concerns, and
potential dependencies. The current need is deterministic package-level regression coverage.

### Real embedding database or Testcontainers

Rejected because evaluation fixtures must run offline and quickly. Fake `EmbeddingService`
results are enough to exercise the Spec #031 runtime path.

### Provider-generated answer scoring

Rejected because generated answers would be nondeterministic and outside unit-test scope.
Structured answer-state scoring is enough for the approved MVP.

## What This Spec Does Not Do

- Does not add a CLI command.
- Does not add an evaluator service.
- Does not add package dependencies.
- Does not call AI providers.
- Does not use a real database or Testcontainers.
- Does not activate deferred packages.
- Does not change runtime public APIs.
