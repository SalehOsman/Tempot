import { err, ok } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { randomUUID } from 'node:crypto';
import { RAG_MESSAGE_KEYS } from './retrieval-plan.executor.js';
import { validateRAGAnswerState } from './retrieval-plan.validation.js';
import type { RAGAnswerState, RetrievalOutcome } from './retrieval-plan.types.js';

export function buildAnswerState(
  outcome: RetrievalOutcome,
): Result<RAGAnswerState, AppError> {
  const answer = outcome.degraded
    ? createDegradedAnswer()
    : createGroundedAnswer(outcome);
  const validated = validateRAGAnswerState(answer);
  if (validated.isErr()) return err(validated.error);
  return ok(validated.value);
}

function createGroundedAnswer(outcome: RetrievalOutcome): RAGAnswerState {
  if (outcome.selectedBlockIds.length === 0) {
    return {
      answerId: randomUUID(),
      state: 'no-context',
      messageKey: RAG_MESSAGE_KEYS.NO_CONTEXT,
      citations: [],
      confidence: 0,
    };
  }

  return {
    answerId: randomUUID(),
    state: 'answered',
    citations: outcome.selectedBlockIds.map((blockId) => ({ blockId })),
    confidence: 1,
  };
}

function createDegradedAnswer(): RAGAnswerState {
  return {
    answerId: randomUUID(),
    state: 'degraded',
    messageKey: RAG_MESSAGE_KEYS.DEGRADED,
    citations: [],
    confidence: 0,
  };
}
