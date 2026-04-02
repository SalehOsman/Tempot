import {
  experimental_createProviderRegistry as createProviderRegistry,
  wrapLanguageModel,
} from 'ai';
import type { LanguageModel, LanguageModelMiddleware } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AIConfig } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Provider registry type */
export type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

/**
 * Providers map type — @ai-sdk/google and @ai-sdk/openai implement ProviderV2
 * but createProviderRegistry expects ProviderV3. Both work at runtime;
 * we use Parameters<> extraction to satisfy the type system.
 */
type ProvidersMap = Parameters<typeof createProviderRegistry>[0];

/** Create provider registry with aliased models (ADR-031) */
export function createAIProviderRegistry(config: AIConfig): Result<ProviderRegistry, AppError> {
  if (!config.enabled) {
    return err(new AppError(AI_ERRORS.DISABLED));
  }

  try {
    const registry = createProviderRegistry({ google, openai } as unknown as ProvidersMap);

    return ok(registry);
  } catch (error: unknown) {
    return err(new AppError(AI_ERRORS.PROVIDER_AUTH_FAILED, error));
  }
}

/** Get model ID string for the configured provider */
export function getModelId(config: AIConfig, purpose: 'chat' | 'embedding'): string {
  if (purpose === 'embedding') {
    return `google:${config.embeddingModel}`;
  }

  switch (config.provider) {
    case 'gemini':
      return 'google:gemini-2.0-flash';
    case 'openai':
      return 'openai:gpt-4o';
    default:
      return 'google:gemini-2.0-flash';
  }
}

/** Wrap a model with a chain of middleware (applied innermost-first) — design doc Concern 6 */
export function getWrappedModel(
  registry: ProviderRegistry,
  modelId: string,
  middlewares: LanguageModelMiddleware[],
): LanguageModel {
  let model: LanguageModel = registry.languageModel(
    modelId as Parameters<ProviderRegistry['languageModel']>[0],
  );
  for (const mw of middlewares) {
    model = wrapLanguageModel({ model, middleware: mw });
  }
  return model;
}
