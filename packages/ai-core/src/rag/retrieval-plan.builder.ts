import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { randomUUID } from 'node:crypto';
import type { RetrievalPlan, RetrievalRequest } from './retrieval-plan.types.js';
import { validateRetrievalPlan } from './retrieval-plan.validation.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/**
 * Builds a default RetrievalPlan from a RetrievalRequest.
 * The default plan contains: vector → access-filter → context-assembly steps.
 * Stub implementation — full wiring added in Spec #031 Phase 3.
 */
export function buildDefaultRetrievalPlan(
  request: RetrievalRequest,
): Result<RetrievalPlan, AppError> {
  const plan: RetrievalPlan = {
    planId: randomUUID(),
    requestId: request.requestId,
    createdAt: new Date().toISOString(),
    policy: {
      requireAccessFilter: true,
      allowDegradedContext: false,
    },
    steps: [
      {
        id: 'step-vector',
        kind: 'vector',
        outputRef: 'vector-results',
        required: true,
        params: {
          limit: request.maxResults,
          confidenceThreshold: request.confidenceThreshold,
        },
      },
      {
        id: 'step-access',
        kind: 'access-filter',
        inputRefs: ['vector-results'],
        outputRef: 'filtered-results',
        required: true,
        params: { userScope: request.userScope },
      },
      {
        id: 'step-assembly',
        kind: 'context-assembly',
        inputRefs: ['filtered-results'],
        outputRef: 'context',
        required: true,
        params: {},
      },
    ],
  };

  const validated = validateRetrievalPlan(plan);
  if (validated.isErr()) {
    return err(new AppError(AI_ERRORS.RETRIEVAL_PLAN_INVALID, validated.error));
  }

  return ok(validated.value);
}
