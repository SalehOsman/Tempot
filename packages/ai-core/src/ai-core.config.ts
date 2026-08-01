import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  AIConfig,
  AIEmbeddingProviderType,
  AIProviderType,
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
  const provider = parseProvider(process.env.TEMPOT_AI_PROVIDER, DEFAULT_AI_CONFIG.provider);
  if (provider.isErr()) return err(provider.error);

  const embeddingProvider = parseEmbeddingProvider(
    process.env.AI_EMBEDDING_PROVIDER,
    DEFAULT_AI_CONFIG.embeddingProvider,
  );
  if (embeddingProvider.isErr()) return err(embeddingProvider.error);

  return ok({
    ...DEFAULT_AI_CONFIG,
    enabled,
    provider: provider.value,
    embeddingProvider: embeddingProvider.value,
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? DEFAULT_AI_CONFIG.embeddingModel,
    embeddingBaseUrl: process.env.OLLAMA_BASE_URL,
    embeddingDimensions:
      Number(process.env.AI_EMBEDDING_DIMENSIONS) || DEFAULT_AI_CONFIG.embeddingDimensions,
    confidenceThreshold:
      Number(process.env.AI_CONFIDENCE_THRESHOLD) || DEFAULT_AI_CONFIG.confidenceThreshold,
    generationTimeoutMs:
      Number(process.env.AI_GENERATION_TIMEOUT_MS) || DEFAULT_AI_CONFIG.generationTimeoutMs,
    embeddingTimeoutMs:
      Number(process.env.AI_EMBEDDING_TIMEOUT_MS) || DEFAULT_AI_CONFIG.embeddingTimeoutMs,
    defaultMaxOutputChars:
      Number(process.env.TEMPOT_AI_MAX_OUTPUT_CHARS) || DEFAULT_AI_CONFIG.defaultMaxOutputChars,
  });
}

function parseProvider(
  raw: string | undefined,
  fallback: AIProviderType,
): Result<AIProviderType, AppError> {
  const provider = (raw ?? fallback) as AIProviderType;
  if (provider === 'gemini' || provider === 'openai') return ok(provider);
  if (provider === 'deepseek') return ok(provider);
  return err(new AppError(AI_ERRORS.PROVIDER_UNKNOWN, { provider }));
}

function parseEmbeddingProvider(
  raw: string | undefined,
  fallback: AIEmbeddingProviderType,
): Result<AIEmbeddingProviderType, AppError> {
  const provider = raw ?? fallback;
  if (provider === 'gemini' || provider === 'openai' || provider === 'ollama') return ok(provider);
  return err(new AppError(AI_ERRORS.PROVIDER_UNKNOWN, { provider }));
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
