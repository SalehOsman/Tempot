/** Hierarchical error codes for ai-core module (Rule XXII) */
export const AI_ERRORS = {
  // Package-level
  DISABLED: 'ai-core.disabled',
  ACCESS_DENIED: 'ai-core.access_denied',

  // Provider errors
  PROVIDER_UNAVAILABLE: 'ai-core.provider.unavailable',
  PROVIDER_AUTH_FAILED: 'ai-core.provider.auth_failed',
  PROVIDER_TIMEOUT: 'ai-core.provider.timeout',
  PROVIDER_UNKNOWN: 'ai-core.provider.unknown',

  // Resilience errors
  CIRCUIT_OPEN: 'ai-core.resilience.circuit_open',
  RATE_LIMITED: 'ai-core.resilience.rate_limited',
  BULKHEAD_FULL: 'ai-core.resilience.bulkhead_full',

  // Embedding errors
  EMBEDDING_FAILED: 'ai-core.embedding.failed',
  EMBEDDING_DIMENSION_MISMATCH: 'ai-core.embedding.dimension_mismatch',

  // Content errors
  CONTENT_SIZE_EXCEEDED: 'ai-core.content.size_exceeded',
  CONTENT_TYPE_INVALID: 'ai-core.content.type_invalid',
  CONTENT_CHUNK_FAILED: 'ai-core.content.chunk_failed',
  CONTENT_SANITIZE_FAILED: 'ai-core.content.sanitize_failed',

  // RAG errors
  RAG_NO_RESULTS: 'ai-core.rag.no_results',
  RAG_SEARCH_FAILED: 'ai-core.rag.search_failed',

  // Tool errors
  TOOL_NOT_FOUND: 'ai-core.tool.not_found',
  TOOL_EXECUTION_FAILED: 'ai-core.tool.execution_failed',
  TOOL_UNAUTHORIZED: 'ai-core.tool.unauthorized',

  // Batch errors
  BATCH_EMPTY_ITEMS: 'ai-core.batch.empty_items',

  // Confirmation errors
  CONFIRMATION_EXPIRED: 'ai-core.confirmation.expired',
  CONFIRMATION_REJECTED: 'ai-core.confirmation.rejected',
  CONFIRMATION_CODE_INVALID: 'ai-core.confirmation.code_invalid',

  // Conversation errors
  CONVERSATION_ACTIVE: 'ai-core.conversation.already_active',
  CONVERSATION_NOT_FOUND: 'ai-core.conversation.not_found',
  SUMMARIZATION_FAILED: 'ai-core.conversation.summarization_failed',

  // Audit errors
  AUDIT_LOG_FAILED: 'ai-core.audit.log_failed',

  // Event emission (warning-level, not returned to callers)
  EVENT_PUBLISH_FAILED: 'ai-core.event.publish_failed',
} as const;
