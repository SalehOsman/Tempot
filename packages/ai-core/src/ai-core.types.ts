import type { ZodType } from 'zod';
import type { AsyncResult, Result } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** AI provider identifier */
export type AIProviderType = 'gemini' | 'openai';

/** RAG content type discriminator */
export type AIContentType =
  | 'ui-guide'
  | 'bot-functions'
  | 'db-schema'
  | 'developer-docs'
  | 'custom-knowledge'
  | 'user-memory';

/** Write action confirmation level */
export type ConfirmationLevel = 'none' | 'simple' | 'detailed' | 'escalated';

/** Configuration for ai-core */
export interface AIConfig {
  enabled: boolean;
  provider: AIProviderType;
  embeddingModel: string;
  embeddingDimensions: number;
  confidenceThreshold: number;
  generationTimeoutMs: number;
  embeddingTimeoutMs: number;
  defaultMaxOutputChars?: number;
}

/** Resilience configuration */
export interface ResilienceConfig {
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
  retryMaxAttempts: number;
  timeoutMs: number;
  maxConcurrent: number;
}

/** Rate limiting configuration */
export interface RateLimitConfig {
  userLimit: number;
  adminLimit: number;
  superAdminLimit: number;
  windowMs: number;
}

/** Content chunking configuration */
export interface ChunkingConfig {
  chunkSizeTokens: number;
  overlapTokens: number;
  maxDocumentBytes: number;
}

/** AI tool interface — registered by modules */
export interface AITool {
  name: string;
  description: string;
  parameters: ZodType;
  requiredPermission: {
    action: string;
    subject: string;
  };
  confirmationLevel: ConfirmationLevel;
  version: string;
  execute: (params: unknown) => AsyncResult<unknown, AppError>;
  group?: string;
  maxOutputChars?: number;
}

/** AI session state — stored in Redis via session-manager */
export interface AISession {
  userId: string;
  isActive: boolean;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  startedAt: Date;
  messageCount: number;
}

/** Content to be embedded */
export interface EmbeddingInput {
  contentId: string;
  contentType: AIContentType;
  content: string | Buffer;
  metadata?: Record<string, unknown>;
}

/** Embedding search options */
export interface EmbeddingSearchOptions {
  query: string | Buffer;
  contentTypes: AIContentType[];
  limit?: number;
  confidenceThreshold?: number;
}

/** Embedding search result */
export interface EmbeddingSearchResult {
  contentId: string;
  contentType: AIContentType;
  score: number;
  metadata: Record<string, unknown> | null;
}

/** Chunk result from content chunking */
export interface ContentChunk {
  text: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, unknown>;
}

/** Default configuration values */
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: true,
  provider: 'gemini',
  embeddingModel: 'gemini-embedding-2-preview',
  embeddingDimensions: 3072,
  confidenceThreshold: 0.7,
  generationTimeoutMs: 30_000,
  embeddingTimeoutMs: 10_000,
  defaultMaxOutputChars: 4_000,
};

export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 600_000,
  retryMaxAttempts: 3,
  timeoutMs: 30_000,
  maxConcurrent: 5,
};

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  userLimit: 20,
  adminLimit: 50,
  superAdminLimit: 0,
  windowMs: 86_400_000,
};

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunkSizeTokens: 500,
  overlapTokens: 50,
  maxDocumentBytes: 10_485_760,
};

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Pagination options */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/** Single item in a batch execution */
export interface BatchItem<T> {
  params: T;
}

/** Result of batch execution */
export interface BatchResult {
  results: Array<Result<unknown, AppError>>;
  summary: {
    succeeded: number;
    failed: number;
    total: number;
  };
}
