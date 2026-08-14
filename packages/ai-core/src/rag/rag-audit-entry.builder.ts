import type { Result } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { AIAuditEntry } from '../audit/audit.service.js';
import type { RetrievalOutcome, RetrievalRequest } from './retrieval-plan.types.js';

export function buildRAGAuditEntry(
  request: RetrievalRequest,
  outcome: Result<RetrievalOutcome, AppError>,
  latencyMs: number,
): AIAuditEntry {
  const metadata = outcome.isOk()
    ? successAuditMetadata(request, outcome.value)
    : { requestId: request.requestId };

  return {
    userId: request.userScope.userId,
    action: 'rag_search',
    input: request.queryText,
    latencyMs,
    success: outcome.isOk(),
    errorCode: outcome.isErr() ? outcome.error.code : undefined,
    metadata,
  };
}

function successAuditMetadata(
  request: RetrievalRequest,
  outcome: RetrievalOutcome,
): Record<string, unknown> {
  return {
    requestId: request.requestId,
    planId: outcome.planId,
    outcomeId: outcome.outcomeId,
    selectedBlockCount: outcome.selectedBlockIds.length,
    rejectedBlockCount: outcome.rejectedBlocks.length,
    degraded: outcome.degraded,
  };
}
