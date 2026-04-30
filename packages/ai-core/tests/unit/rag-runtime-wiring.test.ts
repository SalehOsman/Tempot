/**
 * Unit tests for RAGPipeline runtime wiring (Spec #031).
 * Tests are written as stubs — full RED→GREEN cycle executed in Phase 3.
 */
import { describe, it } from 'vitest';

describe('RAGPipeline runtime wiring (Spec #031)', () => {
  it.todo('valid RetrievalRequest produces a RetrievalOutcome with selected block ids and timings');
  it.todo('request with no authorized content types returns ok(outcome) with empty selectedBlockIds');
  it.todo('access-filter step records rejected block ids with reason access-denied');
  it.todo('embedding service failure returns err(AppError) with ai-core.rag.search_failed');
  it.todo('buildAnswerState with selected blocks returns answered with citations');
  it.todo('buildAnswerState with no selected blocks returns no-context with messageKey');
  it.todo('buildAnswerState with degraded outcome returns degraded with messageKey');
  it.todo('legacy retrieve(RetrieveOptions) still returns ok(RAGContext) without modification');
  it.todo('retrieveWithPlan logs rag_search audit entry when audit service dep is provided');
  it.todo('audit service failure does not propagate to caller');
});
