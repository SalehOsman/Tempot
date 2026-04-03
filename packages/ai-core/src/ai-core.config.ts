import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  AIConfig,
  ResilienceConfig,
  RateLimitConfig,
  ChunkingConfig,
} from './ai-core.types.js';
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_RESILIENCE_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_CHUNKING_CONFIG,
} from './ai-core.types.js';
import { AI_ERRORS } from './ai-core.errors.js';

/** Load AI configuration from environment */
export function loadAIConfig(): Result<AIConfig, AppError> {
  const enabled = process.env.TEMPOT_AI !== 'false';
  const provider = (process.env.TEMPOT_AI_PROVIDER ?? 'gemini') as AIConfig['provider'];

  if (provider !== 'gemini' && provider !== 'openai') {
    return err(new AppError(AI_ERRORS.PROVIDER_UNKNOWN, { provider }));
  }

  return ok({
    ...DEFAULT_AI_CONFIG,
    enabled,
    provider,
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? DEFAULT_AI_CONFIG.embeddingModel,
    embeddingDimensions:
      Number(process.env.AI_EMBEDDING_DIMENSIONS) || DEFAULT_AI_CONFIG.embeddingDimensions,
    confidenceThreshold:
      Number(process.env.AI_CONFIDENCE_THRESHOLD) || DEFAULT_AI_CONFIG.confidenceThreshold,
    generationTimeoutMs:
      Number(process.env.AI_GENERATION_TIMEOUT_MS) || DEFAULT_AI_CONFIG.generationTimeoutMs,
    embeddingTimeoutMs:
      Number(process.env.AI_EMBEDDING_TIMEOUT_MS) || DEFAULT_AI_CONFIG.embeddingTimeoutMs,
  });
}

/** Load resilience config from environment */
export function loadResilienceConfig(): ResilienceConfig {
  return {
    ...DEFAULT_RESILIENCE_CONFIG,
    circuitBreakerThreshold:
      Number(process.env.AI_CB_THRESHOLD) || DEFAULT_RESILIENCE_CONFIG.circuitBreakerThreshold,
    circuitBreakerResetMs:
      Number(process.env.AI_CB_RESET_MS) || DEFAULT_RESILIENCE_CONFIG.circuitBreakerResetMs,
    maxConcurrent: Number(process.env.AI_MAX_CONCURRENT) || DEFAULT_RESILIENCE_CONFIG.maxConcurrent,
  };
}

/** Load rate limit config from environment */
export function loadRateLimitConfig(): RateLimitConfig {
  return {
    ...DEFAULT_RATE_LIMIT_CONFIG,
  };
}

/** Load chunking config from environment */
export function loadChunkingConfig(): ChunkingConfig {
  return {
    ...DEFAULT_CHUNKING_CONFIG,
  };
}
