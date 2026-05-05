import type { EmbeddingSearchResult } from '../../src/ai-core.types.js';
import type { RAGAnswerStatus, RetrievalRequest } from '../../src/rag/retrieval-plan.types.js';

export interface RAGEvaluationExpectation {
  selectedBlockIds: readonly string[];
  rejectedBlockIds: readonly string[];
  citationBlockIds: readonly string[];
  forbiddenBlockIds: readonly string[];
  answerState: RAGAnswerStatus;
  messageKey?: string;
}

export interface RAGEvaluationFixture {
  id: string;
  title: string;
  request: RetrievalRequest;
  searchResults: readonly EmbeddingSearchResult[];
  expectation: RAGEvaluationExpectation;
}

export const ragEvaluationFixtures: readonly RAGEvaluationFixture[] = [
  {
    id: 'authorized-hit',
    title: 'Authorized guide content is selected and cited',
    request: request('request-authorized-hit'),
    searchResults: [result('guide-reset', 'ui-guide', null)],
    expectation: {
      selectedBlockIds: ['guide-reset'],
      rejectedBlockIds: [],
      citationBlockIds: ['guide-reset'],
      forbiddenBlockIds: [],
      answerState: 'answered',
    },
  },
  {
    id: 'citation-coverage',
    title: 'Multiple selected blocks require complete citation coverage',
    request: request('request-citation-coverage'),
    searchResults: [
      result('guide-reset', 'ui-guide', null),
      result('memory-reset', 'user-memory', { userId: 'user-1' }),
    ],
    expectation: {
      selectedBlockIds: ['guide-reset', 'memory-reset'],
      rejectedBlockIds: [],
      citationBlockIds: ['guide-reset', 'memory-reset'],
      forbiddenBlockIds: [],
      answerState: 'answered',
    },
  },
  {
    id: 'leakage-prevention',
    title: 'Unauthorized candidates are rejected and never cited',
    request: request('request-leakage-prevention'),
    searchResults: [
      result('guide-reset', 'ui-guide', null),
      result('memory-other', 'user-memory', { userId: 'user-2' }),
      result('custom-user-only', 'custom-knowledge', { accessRoles: ['user'] }),
    ],
    expectation: {
      selectedBlockIds: ['guide-reset'],
      rejectedBlockIds: ['memory-other', 'custom-user-only'],
      citationBlockIds: ['guide-reset'],
      forbiddenBlockIds: ['memory-other', 'custom-user-only'],
      answerState: 'answered',
    },
  },
  {
    id: 'no-context',
    title: 'No usable context produces no-context answer state',
    request: request('request-no-context'),
    searchResults: [],
    expectation: {
      selectedBlockIds: [],
      rejectedBlockIds: [],
      citationBlockIds: [],
      forbiddenBlockIds: [],
      answerState: 'no-context',
      messageKey: 'ai-core.rag.no_context',
    },
  },
];

function request(requestId: string): RetrievalRequest {
  return {
    requestId,
    queryText: 'reset password',
    locale: 'en',
    allowedContentTypes: ['ui-guide', 'user-memory', 'custom-knowledge'],
    userScope: { userId: 'user-1', role: 'admin' },
    maxResults: 5,
    confidenceThreshold: 0.7,
  };
}

function result(
  contentId: string,
  contentType: EmbeddingSearchResult['contentType'],
  metadata: Record<string, unknown> | null,
): EmbeddingSearchResult {
  return { contentId, contentType, score: 0.9, metadata };
}
