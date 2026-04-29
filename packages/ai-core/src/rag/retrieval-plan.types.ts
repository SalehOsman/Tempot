export type RetrievalStepKind =
  | 'vector'
  | 'lexical'
  | 'relationship-expansion'
  | 'content-type-filter'
  | 'access-filter'
  | 'rerank'
  | 'context-assembly';

export interface RetrievalUserScope {
  userId: string;
  role: string;
  botId?: string;
  tenantId?: string;
}

export interface RetrievalRequest {
  requestId: string;
  queryText?: string;
  queryBlockId?: string;
  locale: string;
  allowedContentTypes: readonly string[];
  userScope: RetrievalUserScope;
  maxResults: number;
  confidenceThreshold: number;
}

export interface RetrievalPlanPolicy {
  allowDegradedContext: boolean;
  requireAccessFilter: boolean;
}

export interface RetrievalStep {
  id: string;
  kind: RetrievalStepKind;
  inputRefs?: readonly string[];
  outputRef: string;
  required: boolean;
  params: Record<string, unknown>;
}

export interface RetrievalPlan {
  planId: string;
  requestId: string;
  steps: readonly RetrievalStep[];
  policy: RetrievalPlanPolicy;
  createdAt: string;
}

export type RetrievalRejectedBlockReason =
  | 'access-denied'
  | 'content-type-denied'
  | 'below-threshold'
  | 'duplicate'
  | 'invalid';

export interface RetrievalRejectedBlock {
  blockId: string;
  reason: RetrievalRejectedBlockReason;
  stage: string;
}

export interface RetrievalStageTiming {
  stage: string;
  durationMs: number;
}

export interface RetrievalOutcome {
  outcomeId: string;
  planId: string;
  selectedBlockIds: readonly string[];
  rejectedBlocks: readonly RetrievalRejectedBlock[];
  timings: readonly RetrievalStageTiming[];
  degraded: boolean;
}

export type RAGAnswerStatus = 'answered' | 'no-context' | 'degraded' | 'refused';

export interface RAGAnswerCitation {
  blockId: string;
  sourceId?: string;
}

export interface RAGAnswerUsage {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export interface RAGAnswerState {
  answerId: string;
  state: RAGAnswerStatus;
  messageKey?: string;
  citations: readonly RAGAnswerCitation[];
  confidence: number;
  provider?: string;
  model?: string;
  usage?: RAGAnswerUsage;
}
