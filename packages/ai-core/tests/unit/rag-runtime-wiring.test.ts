import { describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { EmbeddingSearchResult } from '../../src/ai-core.types.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { AIAuditEntry } from '../../src/audit/audit.service.js';
import type { EmbeddingService } from '../../src/embedding/embedding.service.js';
import { buildAnswerState, RAGPipeline } from '../../src/rag/rag-pipeline.service.js';
import type { RetrievalOutcome, RetrievalRequest } from '../../src/rag/retrieval-plan.types.js';

describe('RAGPipeline runtime wiring (Spec #031)', () => {
  it('valid RetrievalRequest produces a RetrievalOutcome with selected block ids and timings', async () => {
    const { service, searchSimilar } = createEmbeddingService(searchResults());
    const result = await new RAGPipeline(service).retrieveWithPlan(createRequest());
    expect(result.isOk()).toBe(true);
    const outcome = result._unsafeUnwrap();
    expect(outcome.selectedBlockIds).toEqual(['guide-1', 'memory-1', 'custom-1']);
    expect(outcome.timings.map((timing) => timing.stage)).toEqual([
      'vector',
      'access-filter',
      'context-assembly',
    ]);
    expect(searchSimilar).toHaveBeenCalledWith({
      query: 'reset password',
      contentTypes: ['ui-guide', 'user-memory', 'custom-knowledge'],
      limit: 5,
      confidenceThreshold: 0.7,
    });
  });

  it('request with no authorized content types returns ok(outcome) with empty selectedBlockIds', async () => {
    const { service } = createEmbeddingService([]);
    const result = await new RAGPipeline(service).retrieveWithPlan(
      createRequest({ allowedContentTypes: [] }),
    );
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().selectedBlockIds).toEqual([]);
  });

  it('access-filter step records rejected block ids with reason access-denied', async () => {
    const { service } = createEmbeddingService([
      searchResult('guide-1', 'ui-guide', null),
      searchResult('memory-2', 'user-memory', { userId: 'user-2' }),
      searchResult('custom-2', 'custom-knowledge', { accessRoles: ['user'] }),
    ]);
    const result = await new RAGPipeline(service).retrieveWithPlan(createRequest());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().rejectedBlocks).toEqual([
      { blockId: 'memory-2', reason: 'access-denied', stage: 'access-filter' },
      { blockId: 'custom-2', reason: 'access-denied', stage: 'access-filter' },
    ]);
  });

  it('embedding service failure returns err(AppError) with ai-core.rag.search_failed', async () => {
    const { service } = createEmbeddingServiceError();
    const result = await new RAGPipeline(service).retrieveWithPlan(createRequest());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_SEARCH_FAILED);
  });

  it('buildAnswerState with selected blocks returns answered with citations', () => {
    const result = buildAnswerState(createOutcome(['guide-1', 'memory-1']));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      state: 'answered',
      citations: [{ blockId: 'guide-1' }, { blockId: 'memory-1' }],
      confidence: 1,
    });
  });

  it('buildAnswerState with no selected blocks returns no-context with messageKey', () => {
    const result = buildAnswerState(createOutcome([]));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      state: 'no-context',
      messageKey: 'ai-core.rag.no_context',
      citations: [],
      confidence: 0,
    });
  });

  it('buildAnswerState with degraded outcome returns degraded with messageKey', () => {
    const result = buildAnswerState(createOutcome(['guide-1'], true));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      state: 'degraded',
      messageKey: 'ai-core.rag.degraded',
      citations: [],
      confidence: 0,
    });
  });

  it('legacy retrieve(RetrieveOptions) still returns ok(RAGContext) without modification', async () => {
    const { service } = createEmbeddingService([
      searchResult('guide-1', 'ui-guide', { title: 'Guide', text: 'Use the reset flow.' }),
    ]);
    const result = await new RAGPipeline(service).retrieve({
      query: 'reset password',
      userRole: 'admin',
      userId: 'user-1',
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      hasResults: true,
      sources: [expect.objectContaining({ contentId: 'guide-1' })],
    });
  });

  it('retrieveWithPlan logs rag_search audit entry when audit service dep is provided', async () => {
    const { service } = createEmbeddingService(searchResults());
    const log = vi.fn(async (_entry: AIAuditEntry) => ok(undefined));
    const pipeline = new RAGPipeline({ embeddingService: service, auditService: { log } });
    const result = await pipeline.retrieveWithPlan(createRequest());
    expect(result.isOk()).toBe(true);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'rag_search', userId: 'user-1', success: true }),
    );
  });

  it('audit service failure does not propagate to caller', async () => {
    const { service } = createEmbeddingService(searchResults());
    const log = vi.fn(async (_entry: AIAuditEntry) => {
      return err(new AppError(AI_ERRORS.AUDIT_LOG_FAILED));
    });
    const pipeline = new RAGPipeline({ embeddingService: service, auditService: { log } });
    const result = await pipeline.retrieveWithPlan(createRequest());
    expect(result.isOk()).toBe(true);
    expect(log).toHaveBeenCalledOnce();
  });
});

function createRequest(overrides: Partial<RetrievalRequest> = {}): RetrievalRequest {
  return {
    requestId: 'request-1',
    queryText: 'reset password',
    locale: 'en',
    allowedContentTypes: ['ui-guide', 'user-memory', 'custom-knowledge'],
    userScope: { userId: 'user-1', role: 'admin' },
    maxResults: 5,
    confidenceThreshold: 0.7,
    ...overrides,
  };
}

function createOutcome(
  selectedBlockIds: readonly string[],
  degraded = false,
): RetrievalOutcome {
  return {
    outcomeId: 'outcome-1',
    planId: 'plan-1',
    selectedBlockIds,
    rejectedBlocks: [],
    timings: [],
    degraded,
  };
}

function createEmbeddingService(results: EmbeddingSearchResult[]) {
  const searchSimilar = vi.fn(async () => ok(results));
  return { service: { searchSimilar } as unknown as EmbeddingService, searchSimilar };
}

function createEmbeddingServiceError() {
  const searchSimilar = vi.fn(async () => err(new AppError(AI_ERRORS.EMBEDDING_FAILED)));
  return { service: { searchSimilar } as unknown as EmbeddingService };
}

function searchResults(): EmbeddingSearchResult[] {
  return [
    searchResult('guide-1', 'ui-guide', null),
    searchResult('memory-1', 'user-memory', { userId: 'user-1' }),
    searchResult('custom-1', 'custom-knowledge', { accessRoles: ['admin'] }),
  ];
}

function searchResult(
  contentId: string,
  contentType: EmbeddingSearchResult['contentType'],
  metadata: Record<string, unknown> | null,
): EmbeddingSearchResult {
  return { contentId, contentType, score: 0.9, metadata };
}
