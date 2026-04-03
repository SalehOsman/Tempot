import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_RESILIENCE_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_CHUNKING_CONFIG,
} from '../../src/ai-core.types.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

describe('ai-core.types', () => {
  describe('DEFAULT_AI_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_AI_CONFIG.enabled).toBe(true);
      expect(DEFAULT_AI_CONFIG.provider).toBe('gemini');
      expect(DEFAULT_AI_CONFIG.embeddingModel).toBe('gemini-embedding-2-preview');
      expect(DEFAULT_AI_CONFIG.embeddingDimensions).toBe(3072);
      expect(DEFAULT_AI_CONFIG.confidenceThreshold).toBe(0.7);
      expect(DEFAULT_AI_CONFIG.generationTimeoutMs).toBe(30_000);
      expect(DEFAULT_AI_CONFIG.embeddingTimeoutMs).toBe(10_000);
    });
  });

  describe('DEFAULT_RESILIENCE_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_RESILIENCE_CONFIG.circuitBreakerThreshold).toBe(5);
      expect(DEFAULT_RESILIENCE_CONFIG.circuitBreakerResetMs).toBe(600_000);
      expect(DEFAULT_RESILIENCE_CONFIG.retryMaxAttempts).toBe(3);
      expect(DEFAULT_RESILIENCE_CONFIG.timeoutMs).toBe(30_000);
      expect(DEFAULT_RESILIENCE_CONFIG.maxConcurrent).toBe(5);
    });
  });

  describe('DEFAULT_RATE_LIMIT_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_RATE_LIMIT_CONFIG.userLimit).toBe(20);
      expect(DEFAULT_RATE_LIMIT_CONFIG.adminLimit).toBe(50);
      expect(DEFAULT_RATE_LIMIT_CONFIG.superAdminLimit).toBe(0);
      expect(DEFAULT_RATE_LIMIT_CONFIG.windowMs).toBe(86_400_000);
    });
  });

  describe('DEFAULT_CHUNKING_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_CHUNKING_CONFIG.chunkSizeTokens).toBe(500);
      expect(DEFAULT_CHUNKING_CONFIG.overlapTokens).toBe(50);
      expect(DEFAULT_CHUNKING_CONFIG.maxDocumentBytes).toBe(10_485_760);
    });
  });
});

describe('ai-core.errors', () => {
  it('exports AI_ERRORS with all 29 error codes', () => {
    expect(AI_ERRORS.DISABLED).toBe('ai-core.disabled');
    expect(AI_ERRORS.ACCESS_DENIED).toBe('ai-core.access_denied');
    expect(AI_ERRORS.PROVIDER_UNAVAILABLE).toBe('ai-core.provider.unavailable');
    expect(AI_ERRORS.PROVIDER_AUTH_FAILED).toBe('ai-core.provider.auth_failed');
    expect(AI_ERRORS.PROVIDER_REFUSAL).toBe('ai-core.provider.refusal');
    expect(AI_ERRORS.PROVIDER_TIMEOUT).toBe('ai-core.provider.timeout');
    expect(AI_ERRORS.PROVIDER_UNKNOWN).toBe('ai-core.provider.unknown');
    expect(AI_ERRORS.CIRCUIT_OPEN).toBe('ai-core.resilience.circuit_open');
    expect(AI_ERRORS.RATE_LIMITED).toBe('ai-core.resilience.rate_limited');
    expect(AI_ERRORS.BULKHEAD_FULL).toBe('ai-core.resilience.bulkhead_full');
    expect(AI_ERRORS.EMBEDDING_FAILED).toBe('ai-core.embedding.failed');
    expect(AI_ERRORS.EMBEDDING_DIMENSION_MISMATCH).toBe('ai-core.embedding.dimension_mismatch');
    expect(AI_ERRORS.CONTENT_SIZE_EXCEEDED).toBe('ai-core.content.size_exceeded');
    expect(AI_ERRORS.CONTENT_TYPE_INVALID).toBe('ai-core.content.type_invalid');
    expect(AI_ERRORS.CONTENT_CHUNK_FAILED).toBe('ai-core.content.chunk_failed');
    expect(AI_ERRORS.CONTENT_SANITIZE_FAILED).toBe('ai-core.content.sanitize_failed');
    expect(AI_ERRORS.RAG_NO_RESULTS).toBe('ai-core.rag.no_results');
    expect(AI_ERRORS.RAG_SEARCH_FAILED).toBe('ai-core.rag.search_failed');
    expect(AI_ERRORS.TOOL_NOT_FOUND).toBe('ai-core.tool.not_found');
    expect(AI_ERRORS.TOOL_EXECUTION_FAILED).toBe('ai-core.tool.execution_failed');
    expect(AI_ERRORS.TOOL_UNAUTHORIZED).toBe('ai-core.tool.unauthorized');
    expect(AI_ERRORS.CONFIRMATION_EXPIRED).toBe('ai-core.confirmation.expired');
    expect(AI_ERRORS.CONFIRMATION_REJECTED).toBe('ai-core.confirmation.rejected');
    expect(AI_ERRORS.CONFIRMATION_CODE_INVALID).toBe('ai-core.confirmation.code_invalid');
    expect(AI_ERRORS.CONVERSATION_ACTIVE).toBe('ai-core.conversation.already_active');
    expect(AI_ERRORS.CONVERSATION_NOT_FOUND).toBe('ai-core.conversation.not_found');
    expect(AI_ERRORS.SUMMARIZATION_FAILED).toBe('ai-core.conversation.summarization_failed');
    expect(AI_ERRORS.AUDIT_LOG_FAILED).toBe('ai-core.audit.log_failed');
    expect(AI_ERRORS.EVENT_PUBLISH_FAILED).toBe('ai-core.event.publish_failed');
  });

  it('all error codes follow hierarchical dot-separated pattern', () => {
    for (const code of Object.values(AI_ERRORS)) {
      expect(code).toMatch(/^ai-core\./);
    }
  });
});
