import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from '../ai-core.errors.js';
import type { Result } from '@tempot/shared';
import type {
  RAGAnswerState,
  RetrievalOutcome,
  RetrievalPlan,
  RetrievalRequest,
  RetrievalStep,
  RetrievalStepKind,
} from './retrieval-plan.types.js';

const STEP_KINDS: readonly RetrievalStepKind[] = [
  'vector',
  'lexical',
  'relationship-expansion',
  'content-type-filter',
  'access-filter',
  'rerank',
  'context-assembly',
];

export function validateRetrievalRequest(
  request: RetrievalRequest,
): Result<RetrievalRequest, AppError> {
  if (isBlank(request.requestId) || isBlank(request.locale)) {
    return invalidRequest('identity');
  }

  if (isBlank(request.queryText) && isBlank(request.queryBlockId)) {
    return invalidRequest('query');
  }

  if (!hasAllowedContentTypes(request) || !hasUserScope(request)) {
    return invalidRequest('scope');
  }

  if (!Number.isInteger(request.maxResults) || request.maxResults <= 0) {
    return invalidRequest('max_results');
  }

  if (!isConfidence(request.confidenceThreshold)) {
    return invalidRequest('confidence');
  }

  return ok(request);
}

export function validateRetrievalPlan(
  plan: RetrievalPlan,
): Result<RetrievalPlan, AppError> {
  if (isBlank(plan.planId) || isBlank(plan.requestId) || isBlank(plan.createdAt)) {
    return invalidPlan('identity');
  }

  if (!Array.isArray(plan.steps) || plan.steps.length === 0 || !hasPolicy(plan)) {
    return invalidPlan('steps_or_policy');
  }

  if (!plan.steps.every(isValidStep)) {
    return invalidPlan('step');
  }

  const contextIndex = findStepIndex(plan, 'context-assembly');
  const accessIndex = findStepIndex(plan, 'access-filter');

  if (accessIndex < 0 || (contextIndex >= 0 && accessIndex > contextIndex)) {
    return err(new AppError(AI_ERRORS.RETRIEVAL_PLAN_ACCESS_FILTER_MISSING));
  }

  if (isRelationshipExpansionAfterContext(plan, contextIndex)) {
    return invalidPlan('relationship_after_context');
  }

  return ok(plan);
}

export function validateRetrievalOutcome(
  outcome: RetrievalOutcome,
): Result<RetrievalOutcome, AppError> {
  if (isBlank(outcome.outcomeId) || isBlank(outcome.planId)) {
    return invalidOutcome('identity');
  }

  if (!Array.isArray(outcome.selectedBlockIds) || !Array.isArray(outcome.timings)) {
    return invalidOutcome('collections');
  }

  if (!Array.isArray(outcome.rejectedBlocks) || typeof outcome.degraded !== 'boolean') {
    return invalidOutcome('rejected_or_degraded');
  }

  if (!outcome.rejectedBlocks.every(hasRejectedBlockShape)) {
    return invalidOutcome('rejected_block');
  }

  if (!outcome.timings.every(hasTimingShape)) {
    return invalidOutcome('timing');
  }

  return ok(outcome);
}

export function validateRAGAnswerState(
  answer: RAGAnswerState,
): Result<RAGAnswerState, AppError> {
  if (isBlank(answer.answerId) || isBlank(answer.state) || !isConfidence(answer.confidence)) {
    return err(new AppError(AI_ERRORS.RAG_ANSWER_INVALID));
  }

  if (answer.state === 'answered') {
    if (!answer.citations.every(hasCitationShape) || answer.citations.length === 0) {
      return err(new AppError(AI_ERRORS.RAG_GROUNDING_INVALID));
    }
    return ok(answer);
  }

  if (isBlank(answer.messageKey)) {
    return err(new AppError(AI_ERRORS.RAG_ANSWER_INVALID));
  }

  return ok(answer);
}

function invalidRequest(reason: string): Result<RetrievalRequest, AppError> {
  return err(new AppError(AI_ERRORS.RETRIEVAL_REQUEST_INVALID, { reason }));
}

function invalidPlan(reason: string): Result<RetrievalPlan, AppError> {
  return err(new AppError(AI_ERRORS.RETRIEVAL_PLAN_INVALID, { reason }));
}

function invalidOutcome(reason: string): Result<RetrievalOutcome, AppError> {
  return err(new AppError(AI_ERRORS.RETRIEVAL_OUTCOME_INVALID, { reason }));
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

function isConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasAllowedContentTypes(request: RetrievalRequest): boolean {
  return request.allowedContentTypes.every((type) => !isBlank(type));
}

function hasUserScope(request: RetrievalRequest): boolean {
  return !isBlank(request.userScope?.userId) && !isBlank(request.userScope?.role);
}

function hasPolicy(plan: RetrievalPlan): boolean {
  return typeof plan.policy?.allowDegradedContext === 'boolean'
    && plan.policy.requireAccessFilter === true;
}

function isValidStep(step: RetrievalStep): boolean {
  return !isBlank(step.id)
    && STEP_KINDS.includes(step.kind)
    && !isBlank(step.outputRef)
    && typeof step.required === 'boolean'
    && isPlainRecord(step.params);
}

function findStepIndex(plan: RetrievalPlan, kind: RetrievalStepKind): number {
  return plan.steps.findIndex((step) => step.kind === kind);
}

function isRelationshipExpansionAfterContext(
  plan: RetrievalPlan,
  contextIndex: number,
): boolean {
  if (contextIndex < 0) return false;
  return plan.steps.some((step, index) => {
    return step.kind === 'relationship-expansion' && index > contextIndex;
  });
}

function hasRejectedBlockShape(block: { blockId: string; reason: string; stage: string }): boolean {
  return !isBlank(block.blockId) && !isBlank(block.reason) && !isBlank(block.stage);
}

function hasTimingShape(timing: { stage: string; durationMs: number }): boolean {
  return !isBlank(timing.stage) && Number.isFinite(timing.durationMs) && timing.durationMs >= 0;
}

function hasCitationShape(citation: { blockId: string; sourceId?: string }): boolean {
  return !isBlank(citation.blockId);
}
