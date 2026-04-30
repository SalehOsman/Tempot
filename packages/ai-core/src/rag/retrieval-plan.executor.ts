import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { randomUUID } from 'node:crypto';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import { AI_ERRORS } from '../ai-core.errors.js';
import type {
  RetrievalOutcome,
  RetrievalPlan,
  RetrievalRejectedBlock,
  RetrievalRequest,
  RetrievalStageTiming,
} from './retrieval-plan.types.js';

/** i18n message keys — never hardcoded user-facing strings */
export const RAG_MESSAGE_KEYS = {
  NO_CONTEXT: 'ai-core.rag.no_context',
  DEGRADED: 'ai-core.rag.degraded',
} as const;

/**
 * Executes a RetrievalPlan against the EmbeddingService and returns a RetrievalOutcome.
 * Enforces access-filter step before context-assembly.
 * Stub implementation — full wiring added in Spec #031 Phase 3.
 */
export async function executeRetrievalPlan(
  plan: RetrievalPlan,
  request: RetrievalRequest,
  embeddingService: EmbeddingService,
): AsyncResult<RetrievalOutcome, AppError> {
  const timings: RetrievalStageTiming[] = [];
  const rejectedBlocks: RetrievalRejectedBlock[] = [];
  let selectedBlockIds: string[] = [];

  // Step: vector
  const vectorStart = Date.now();
  const searchResult = await embeddingService.searchSimilar({
    query: request.queryText ?? '',
    contentTypes: request.allowedContentTypes as string[],
    limit: request.maxResults,
    confidenceThreshold: request.confidenceThreshold,
  });

  timings.push({ stage: 'vector', durationMs: Date.now() - vectorStart });

  if (searchResult.isErr()) {
    return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, searchResult.error));
  }

  const rawResults = searchResult.value;

  // Step: access-filter — enforce userScope
  const accessStart = Date.now();
  for (const result of rawResults) {
    const meta = result.metadata as Record<string, unknown> | null;
    const authorized = isAuthorized(result.contentType, meta, request);

    if (authorized) {
      selectedBlockIds.push(result.contentId);
    } else {
      rejectedBlocks.push({
        blockId: result.contentId,
        reason: 'access-denied',
        stage: 'access-filter',
      });
    }
  }
  timings.push({ stage: 'access-filter', durationMs: Date.now() - accessStart });

  // Step: context-assembly
  const assemblyStart = Date.now();
  timings.push({ stage: 'context-assembly', durationMs: Date.now() - assemblyStart });

  return ok({
    outcomeId: randomUUID(),
    planId: plan.planId,
    selectedBlockIds,
    rejectedBlocks,
    timings,
    degraded: false,
  });
}

function isAuthorized(
  contentType: string,
  meta: Record<string, unknown> | null,
  request: RetrievalRequest,
): boolean {
  if (contentType === 'user-memory') {
    return (meta?.['userId'] as string | undefined) === request.userScope.userId;
  }
  if (contentType === 'custom-knowledge') {
    const roles = meta?.['accessRoles'] as string[] | undefined;
    return roles ? roles.includes(request.userScope.role) : false;
  }
  return true;
}
