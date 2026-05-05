import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { RAGAnswerState, RetrievalOutcome } from '../../src/rag/retrieval-plan.types.js';
import type { RAGEvaluationExpectation } from '../fixtures/rag-evaluation.fixtures.js';

export interface EvaluateRAGFixtureInput {
  outcome: RetrievalOutcome;
  answerState: RAGAnswerState;
  expectation: RAGEvaluationExpectation;
}

export interface RAGEvaluationScore {
  retrievalHit: boolean;
  citationCoverage: boolean;
  leakageDetected: boolean;
  noContextCorrect: boolean;
  missingSelectedBlockIds: readonly string[];
  missingCitationBlockIds: readonly string[];
  leakedBlockIds: readonly string[];
}

export function evaluateRAGFixture(
  input: EvaluateRAGFixtureInput,
): Result<RAGEvaluationScore, AppError> {
  const validation = validateExpectation(input.expectation);
  if (validation.isErr()) return err(validation.error);

  const selected = input.outcome.selectedBlockIds;
  const cited = input.answerState.citations.map((citation) => citation.blockId);
  const missingSelectedBlockIds = missingIds(input.expectation.selectedBlockIds, selected);
  const missingCitationBlockIds = missingIds(input.expectation.citationBlockIds, cited);
  const leakedBlockIds = leakedIds(input.expectation.forbiddenBlockIds, selected, cited);
  const uncitedSelection = missingIds(cited, selected);

  return ok({
    retrievalHit: missingSelectedBlockIds.length === 0,
    citationCoverage: missingCitationBlockIds.length === 0 && uncitedSelection.length === 0,
    leakageDetected: leakedBlockIds.length > 0,
    noContextCorrect: isNoContextCorrect(input.answerState, input.expectation),
    missingSelectedBlockIds,
    missingCitationBlockIds,
    leakedBlockIds,
  });
}

function validateExpectation(expectation: RAGEvaluationExpectation): Result<void, AppError> {
  const ids = [
    ...expectation.selectedBlockIds,
    ...expectation.citationBlockIds,
    ...expectation.forbiddenBlockIds,
  ];
  if (ids.some((id) => id.trim().length === 0)) {
    return err(new AppError(AI_ERRORS.RETRIEVAL_OUTCOME_INVALID));
  }
  return ok(undefined);
}

function isNoContextCorrect(
  answerState: RAGAnswerState,
  expectation: RAGEvaluationExpectation,
): boolean {
  if (expectation.answerState !== 'no-context') return true;
  return answerState.state === 'no-context' && answerState.messageKey === expectation.messageKey;
}

function missingIds(
  expectedIds: readonly string[],
  actualIds: readonly string[],
): readonly string[] {
  const actual = new Set(actualIds);
  return expectedIds.filter((id) => !actual.has(id));
}

function leakedIds(
  forbiddenIds: readonly string[],
  selectedIds: readonly string[],
  citationIds: readonly string[],
): readonly string[] {
  const forbidden = new Set(forbiddenIds);
  const leaked = [...selectedIds, ...citationIds].filter((id) => forbidden.has(id));
  return [...new Set(leaked)];
}
