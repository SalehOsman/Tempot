// @tempot/ai-core — barrel exports

// Toggle guard (Rule XVI)
export { guardEnabled } from './ai-core.guard.js';

// Types
export type {
  AIProviderType,
  AIContentType,
  ConfirmationLevel,
  AIConfig,
  ResilienceConfig,
  RateLimitConfig,
  ChunkingConfig,
  AITool,
  AISession,
  EmbeddingInput,
  EmbeddingSearchOptions,
  EmbeddingSearchResult,
  ContentChunk,
  PaginatedResult,
  PaginationOptions,
  BatchItem,
  BatchResult,
} from './ai-core.types.js';
export {
  DEFAULT_AI_CONFIG,
  DEFAULT_RESILIENCE_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_CHUNKING_CONFIG,
} from './ai-core.types.js';

// Contracts (structural DI interfaces)
export type {
  AILogger,
  AIEventBus,
  AICache,
  AIAbilityChecker,
  AIRegistry,
} from './ai-core.contracts.js';

// Errors
export { AI_ERRORS } from './ai-core.errors.js';

// Config
export {
  loadAIConfig,
  loadResilienceConfig,
  loadRateLimitConfig,
  loadChunkingConfig,
} from './ai-core.config.js';

// Provider factory
export type { ProviderRegistry } from './provider/ai-provider.factory.js';
export {
  createAIProviderRegistry,
  getModelId,
  getWrappedModel,
} from './provider/ai-provider.factory.js';

// Services
export { ResilienceService } from './resilience/resilience.service.js';
export { EmbeddingService } from './embedding/embedding.service.js';
export type { EmbeddingServiceDeps } from './embedding/embedding.service.js';
export { RateLimiterService } from './rate-limiter/rate-limiter.service.js';
export type { RateLimitRole } from './rate-limiter/rate-limiter.service.js';
export { AuditService } from './audit/audit.service.js';
export type { AIAuditEntry } from './audit/audit.service.js';
export { ContentIngestionService } from './content/content-ingestion.service.js';
export type { ContentIngestionDeps, IngestOptions } from './content/content-ingestion.service.js';
export { RAGPipeline } from './rag/rag-pipeline.service.js';
export type { RAGContext, RetrieveOptions } from './rag/rag-pipeline.service.js';
export { ToolRegistry } from './tools/tool.registry.js';
export { executeBatch } from './tools/batch-executor.js';
export type { BatchExecutorDeps } from './tools/batch-executor.js';
export { CASLToolFilter } from './tools/casl-tool.filter.js';
export { ConfirmationEngine } from './confirmation/confirmation.engine.js';
export type {
  PendingConfirmation,
  CreateConfirmationOptions,
  ConfirmOptions,
} from './confirmation/confirmation.engine.js';
export { IntentRouter } from './router/intent.router.js';
export type { IntentResult, IntentRouterDeps, RouteOptions } from './router/intent.router.js';
export { ConversationMemory } from './memory/conversation-memory.service.js';
export type {
  ConversationMemoryDeps,
  SummarizeOptions,
  RetrieveContextOptions,
} from './memory/conversation-memory.service.js';
export { AlternativeSuggestions } from './suggestions/alternative.suggestions.js';

// Middleware
export { createCacheMiddleware } from './cache/ai-cache.middleware.js';

// Prompts
export { getSystemPrompt } from './prompts/role-system.prompts.js';

// UI
export { TelegramAssistantUI } from './ui/telegram-assistant.ui.js';
export type {
  TelegramAssistantDeps,
  HandleMessageOptions,
  EndSessionOptions,
} from './ui/telegram-assistant.ui.js';

// CLI tools
export { DevAssistant } from './cli/dev.assistant.js';
export type { DevAssistantDeps, DevAssistantResult } from './cli/dev.assistant.js';
export { ModuleReviewer } from './cli/module.reviewer.js';
export type { ModuleReviewerDeps, ReviewCheck, ReviewResult } from './cli/module.reviewer.js';

// Pagination
export { paginate } from './pagination/pagination.util.js';

// Tool output utilities
export { truncateToolOutput } from './tools/output-limiter.util.js';

// Input normalization preprocessors
export {
  coerceNumber,
  coerceInteger,
  coerceBoolean,
  normalizeString,
  flexibleDate,
  normalizeArray,
  preprocessors,
} from './tools/input-normalization.js';

// Chunking — Markdown-aware content splitting
export { chunkMarkdown } from './chunking/index.js';
export type { MarkdownChunkOptions } from './chunking/index.js';
