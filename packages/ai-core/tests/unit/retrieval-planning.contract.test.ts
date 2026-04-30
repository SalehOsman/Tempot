import { describe, expect, it } from 'vitest';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import {
  validateRAGAnswerState,
  validateRetrievalOutcome,
  validateRetrievalPlan,
  validateRetrievalRequest,
} from '../../src/index.js';
import type {
  RAGAnswerState,
  RetrievalOutcome,
  RetrievalPlan,
  RetrievalRequest,
} from '../../src/index.js';

const userScope = {
  userId: 'user-1',
  role: 'user',
  botId: 'bot-1',
  tenantId: 'tenant-1',
} as const;

function createRequest(overrides: Partial<RetrievalRequest> = {}): RetrievalRequest {
  return {
    requestId: 'request-1',
    queryText: 'how do invoices work?',
    locale: 'en',
    allowedContentTypes: ['ui-guide'],
    userScope,
    maxResults: 5,
    confidenceThreshold: 0.7,
    ...overrides,
  };
}

function createPlan(overrides: Partial<RetrievalPlan> = {}): RetrievalPlan {
  return {
    planId: 'plan-1',
    requestId: 'request-1',
    createdAt: '2026-04-29T20:00:00.000Z',
    policy: {
      allowDegradedContext: false,
      requireAccessFilter: true,
    },
    steps: [
      {
        id: 'step-vector',
        kind: 'vector',
        outputRef: 'vector-candidates',
        required: true,
        params: { limit: 20 },
      },
      {
        id: 'step-access',
        kind: 'access-filter',
        inputRefs: ['vector-candidates'],
        outputRef: 'authorized-candidates',
        required: true,
        params: { policy: 'current-user' },
      },
      {
        id: 'step-rerank',
        kind: 'rerank',
        inputRefs: ['authorized-candidates'],
        outputRef: 'ranked-candidates',
        required: false,
        params: { model: 'local' },
      },
      {
        id: 'step-context',
        kind: 'context-assembly',
        inputRefs: ['ranked-candidates'],
        outputRef: 'generation-context',
        required: true,
        params: { maxBlocks: 5 },
      },
    ],
    ...overrides,
  };
}

function createOutcome(overrides: Partial<RetrievalOutcome> = {}): RetrievalOutcome {
  return {
    outcomeId: 'outcome-1',
    planId: 'plan-1',
    selectedBlockIds: ['block-1'],
    rejectedBlocks: [
      {
        blockId: 'block-2',
        reason: 'access-denied',
        stage: 'access-filter',
      },
    ],
    timings: [
      {
        stage: 'vector',
        durationMs: 24,
      },
      {
        stage: 'access-filter',
        durationMs: 2,
      },
    ],
    degraded: false,
    ...overrides,
  };
}

function createAnswer(overrides: Partial<RAGAnswerState> = {}): RAGAnswerState {
  return {
    answerId: 'answer-1',
    state: 'answered',
    citations: [{ blockId: 'block-1', sourceId: 'source-1' }],
    confidence: 0.86,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    ...overrides,
  };
}

describe('Retrieval planning public contracts', () => {
  it('validates a retrieval request through the public barrel', () => {
    const request = createRequest();

    const result = validateRetrievalRequest(request);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(request);
  });

  it('validates a hybrid retrieval plan with access filtering', () => {
    const plan = createPlan();

    const result = validateRetrievalPlan(plan);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(plan);
  });

  it('rejects retrieval plans without access filtering', () => {
    const plan = createPlan({
      steps: createPlan().steps.filter((step) => step.kind !== 'access-filter'),
    });

    const result = validateRetrievalPlan(plan);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(
      AI_ERRORS.RETRIEVAL_PLAN_ACCESS_FILTER_MISSING,
    );
  });

  it('validates retrieval outcomes with rejected block reasons', () => {
    const outcome = createOutcome();

    const result = validateRetrievalOutcome(outcome);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(outcome);
  });

  it('validates answered RAG states with citations', () => {
    const answer = createAnswer();

    const result = validateRAGAnswerState(answer);

    expect(result.isOk()).toBe(true);
  });

  it('rejects answered RAG states without citations', () => {
    const answer = createAnswer({ citations: [] });

    const result = validateRAGAnswerState(answer);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_GROUNDING_INVALID);
  });

  it('requires i18n message keys for non-answered RAG states', () => {
    const answer = createAnswer({
      state: 'no-context',
      citations: [],
      messageKey: 'ai-core.rag.no_context',
      provider: undefined,
      model: undefined,
    });

    const result = validateRAGAnswerState(answer);

    expect(result.isOk()).toBe(true);
  });
});
