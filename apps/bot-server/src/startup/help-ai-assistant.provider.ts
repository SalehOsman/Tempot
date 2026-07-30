import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AIEventBus, AILogger, AIRegistry } from '@tempot/ai-core';
import type {
  HelpAssistantProvider,
  HelpAssistantQuestion,
  HelpAssistantResult,
  ModuleLogger,
  ModuleEventBus,
  SettingsProvider,
} from '../bot-server.types.js';
import { buildHelpAssistantAnswer } from './help-ai-answer.builder.js';
import type { HelpRagResult, RAGContext, RetrieveOptions } from './help-ai-rag.types.js';
import { applyKnowledgeAISettings } from './knowledge-ai-settings.js';
import { classifyHelpAiError } from './help-ai-error-classifier.js';
import { resolveHelpRagConfidenceThreshold } from './help-rag-threshold.config.js';
import { filterUsableHelpContext, hasUsableHelpContext } from './help-ai-context-quality.js';

export interface HelpRagRetriever {
  retrieve(options: RetrieveOptions): Promise<HelpRagResult>;
}

interface LiveProviderDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  settings?: SettingsProvider;
}

type ProviderRegistryCandidate = {
  languageModel?: AIRegistry['languageModel'];
  embeddingModel?: AIRegistry['textEmbeddingModel'];
};

export function createHelpAiAssistantProvider(retriever: HelpRagRetriever): HelpAssistantProvider {
  return {
    ask: async (input) =>
      mapRetrievalResult(input, await retriever.retrieve(toRetrieveOptions(input))),
  };
}

export function buildHelpAiAssistantProvider(deps: LiveProviderDeps): HelpAssistantProvider {
  return createHelpAiAssistantProvider({
    retrieve: (options) => retrieveFromLiveRuntime(options, deps),
  });
}

async function retrieveFromLiveRuntime(
  options: RetrieveOptions,
  deps: LiveProviderDeps,
): Promise<HelpRagResult> {
  const runtime = await createRuntime(deps);
  if (runtime.success === false) return err(runtime.error);
  try {
    return await runtime.pipeline.retrieve({
      ...options,
      confidenceThreshold: resolveHelpRagConfidenceThreshold(
        process.env,
        runtime.embeddingProvider,
      ),
    });
  } finally {
    await runtime.close();
  }
}

async function createRuntime(deps: LiveProviderDeps) {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl)
    return { success: false as const, error: new AppError('bot-server.ai.database_url_missing') };
  const aiCore = await import('@tempot/ai-core');
  const config = aiCore.loadAIConfig();
  if (config.isErr()) return { success: false as const, error: config.error };
  const runtimeConfig = await applyKnowledgeAISettings(config.value, deps.settings);
  const registry = aiCore.createAIProviderRegistry(runtimeConfig);
  if (registry.isErr()) return { success: false as const, error: registry.error };

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  const resilience = new aiCore.ResilienceService(
    aiCore.loadResilienceConfig(),
    toAiLogger(deps.logger),
    toAiEventBus(deps.eventBus),
  );
  const embeddingService = new aiCore.EmbeddingService(db, {
    config: runtimeConfig,
    resilience,
    registry: toAiRegistry(registry.value),
  });
  return {
    success: true as const,
    pipeline: new aiCore.RAGPipeline({ embeddingService }),
    embeddingProvider: runtimeConfig.embeddingProvider,
    close: () => pool.end(),
  };
}

function toRetrieveOptions(input: HelpAssistantQuestion): RetrieveOptions {
  return {
    query: input.question,
    userId: input.userId,
    userRole: toAiRole(input.role),
    confidenceThreshold: resolveHelpRagConfidenceThreshold(),
  };
}

function mapRetrievalResult(
  input: HelpAssistantQuestion,
  result: HelpRagResult,
): HelpAssistantResult {
  if (result.isErr()) return { success: false, error: { code: classifyHelpAiError(result.error) } };
  if (!hasUsableHelpContext(input, result.value)) {
    return {
      success: true,
      value: { state: 'no-context', answer: '', citations: [], confidence: 0 },
    };
  }
  return { success: true, value: toAnswer(input, filterUsableHelpContext(input, result.value)) };
}

function toAnswer(input: HelpAssistantQuestion, context: RAGContext) {
  return buildHelpAssistantAnswer(input, context);
}

function toAiRole(role: HelpAssistantQuestion['role']): string {
  return { GUEST: 'guest', USER: 'user', ADMIN: 'admin', SUPER_ADMIN: 'super_admin' }[role];
}

function toAiRegistry(registry: unknown): AIRegistry {
  const candidate = registry as ProviderRegistryCandidate;
  if (
    typeof candidate.languageModel !== 'function' ||
    typeof candidate.embeddingModel !== 'function'
  ) {
    throw new AppError('bot-server.ai.registry_invalid');
  }
  const languageModel = candidate.languageModel.bind(candidate);
  const embeddingModel = candidate.embeddingModel.bind(candidate);
  return {
    languageModel: (id) => languageModel(id),
    textEmbeddingModel: (id) => embeddingModel(id),
  };
}

function toAiLogger(logger: ModuleLogger): AILogger {
  return {
    info: (data) => logger.info(data),
    warn: (data) => logger.warn(data),
    error: (data) => logger.error(data),
    debug: (data) => logger.debug(data),
  };
}

function toAiEventBus(eventBus: ModuleEventBus): AIEventBus {
  return {
    publish: async (event, payload) => {
      await eventBus.publish(event, isRecord(payload) ? payload : { payload });
      return ok(undefined);
    },
    subscribe: () => undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
