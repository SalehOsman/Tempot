export type ContentSourceKind =
  | 'document'
  | 'message'
  | 'module-artifact'
  | 'imported-dataset'
  | 'custom-knowledge';

export type ContentBlockType =
  | 'text'
  | 'table'
  | 'image'
  | 'chart'
  | 'formula'
  | 'audio'
  | 'video'
  | 'pdf-page'
  | 'metadata';

export type PIIState = 'raw' | 'sanitized' | 'redacted' | 'none';

export type EmbeddingState = 'not-indexed' | 'indexed' | 'failed' | 'stale';

export type GroundedAnswerState =
  | 'answered'
  | 'no-context'
  | 'refused'
  | 'degraded'
  | 'failed';

export interface ContentAccessPolicy {
  policyId: string;
  scope: 'public' | 'role' | 'user' | 'tenant' | 'custom';
  roleIds?: readonly string[];
  userIds?: readonly string[];
  tenantId?: string;
  botId?: string;
}

export interface ContentSource {
  id: string;
  kind: ContentSourceKind;
  originPackage: string;
  title?: string;
  locale?: string;
  checksum?: string;
  accessPolicy: ContentAccessPolicy;
  botId?: string;
  tenantId?: string;
}

export interface BinaryReference {
  storageKey: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface ContentBlock {
  id: string;
  sourceId: string;
  blockType: ContentBlockType;
  sequence: number;
  text?: string;
  binaryRef?: BinaryReference;
  metadata: Record<string, unknown>;
  extractionConfidence: number;
  accessPolicy: ContentAccessPolicy;
  piiState: PIIState;
  embeddingState: EmbeddingState;
}

export interface ContentBlockEmbeddingPolicy {
  allowRawPII?: boolean;
  allowedRawPIIBlockTypes?: readonly ContentBlockType[];
}

export interface GroundedAnswerUsage {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export interface GroundedAnswer {
  answerId: string;
  state: GroundedAnswerState;
  messageKey?: string;
  citations: readonly string[];
  confidence: number;
  provider?: string;
  model?: string;
  usage?: GroundedAnswerUsage;
}
