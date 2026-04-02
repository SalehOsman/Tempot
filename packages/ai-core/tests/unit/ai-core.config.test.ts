import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadAIConfig,
  loadResilienceConfig,
  loadRateLimitConfig,
  loadChunkingConfig,
} from '../../src/ai-core.config.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

describe('loadAIConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns defaults when no env vars set', () => {
    const result = loadAIConfig();
    expect(result.isOk()).toBe(true);
    const config = result._unsafeUnwrap();
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe('gemini');
    expect(config.embeddingModel).toBe('gemini-embedding-2-preview');
    expect(config.embeddingDimensions).toBe(3072);
  });

  it('sets enabled=false when TEMPOT_AI=false', () => {
    process.env.TEMPOT_AI = 'false';
    const result = loadAIConfig();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().enabled).toBe(false);
  });

  it('accepts gemini provider', () => {
    process.env.TEMPOT_AI_PROVIDER = 'gemini';
    const result = loadAIConfig();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().provider).toBe('gemini');
  });

  it('accepts openai provider', () => {
    process.env.TEMPOT_AI_PROVIDER = 'openai';
    const result = loadAIConfig();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().provider).toBe('openai');
  });

  it('returns err for invalid provider', () => {
    process.env.TEMPOT_AI_PROVIDER = 'anthropic';
    const result = loadAIConfig();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.PROVIDER_UNKNOWN);
  });

  it('overrides embedding model from env', () => {
    process.env.AI_EMBEDDING_MODEL = 'custom-model';
    const result = loadAIConfig();
    expect(result._unsafeUnwrap().embeddingModel).toBe('custom-model');
  });

  it('overrides embedding dimensions from env', () => {
    process.env.AI_EMBEDDING_DIMENSIONS = '1536';
    const result = loadAIConfig();
    expect(result._unsafeUnwrap().embeddingDimensions).toBe(1536);
  });

  it('overrides timeout from env', () => {
    process.env.AI_GENERATION_TIMEOUT_MS = '60000';
    const result = loadAIConfig();
    expect(result._unsafeUnwrap().generationTimeoutMs).toBe(60000);
  });
});

describe('loadResilienceConfig', () => {
  it('returns defaults', () => {
    const config = loadResilienceConfig();
    expect(config.circuitBreakerThreshold).toBe(5);
    expect(config.circuitBreakerResetMs).toBe(600_000);
    expect(config.maxConcurrent).toBe(5);
  });
});

describe('loadRateLimitConfig', () => {
  it('returns defaults', () => {
    const config = loadRateLimitConfig();
    expect(config.userLimit).toBe(20);
    expect(config.adminLimit).toBe(50);
    expect(config.superAdminLimit).toBe(0);
  });
});

describe('loadChunkingConfig', () => {
  it('returns defaults', () => {
    const config = loadChunkingConfig();
    expect(config.chunkSizeTokens).toBe(500);
    expect(config.overlapTokens).toBe(50);
    expect(config.maxDocumentBytes).toBe(10_485_760);
  });
});
