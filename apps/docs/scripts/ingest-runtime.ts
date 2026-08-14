import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import {
  ContentIngestionService,
  createAIProviderRegistry,
  EmbeddingService,
  guardEnabled,
  loadAIConfig,
  loadChunkingConfig,
  loadResilienceConfig,
  ResilienceService,
} from '@tempot/ai-core';
import type { AIEventBus, AILogger, AIRegistry } from '@tempot/ai-core';
import type { DocsIngestionRuntime } from './docs.types.js';

const logger: AILogger = {
  info: (data) => {
    process.stderr.write(JSON.stringify({ level: 'info', ...data }) + '\n');
  },
  warn: (data) => {
    process.stderr.write(JSON.stringify({ level: 'warn', ...data }) + '\n');
  },
  error: (data) => {
    process.stderr.write(JSON.stringify({ level: 'error', ...data }) + '\n');
  },
  debug: (data) => {
    process.stderr.write(JSON.stringify({ level: 'debug', ...data }) + '\n');
  },
};

const eventBus: AIEventBus = {
  publish: async () => ok(undefined),
  subscribe: () => undefined,
};

type ProviderRegistryCandidate = {
  languageModel?: AIRegistry['languageModel'];
  embeddingModel?: AIRegistry['textEmbeddingModel'];
};

/** Compose live docs ingestion dependencies for explicit write mode. */
export async function createDocsIngestionRuntime(): AsyncResult<DocsIngestionRuntime, AppError> {
  const config = loadAIConfig();
  if (config.isErr()) return err(config.error);

  return guardEnabled(config.value.enabled, async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return err(new AppError('DOCS.DATABASE_URL_MISSING'));
    }

    const registry = createAIProviderRegistry(config.value);
    if (registry.isErr()) return err(registry.error);
    const registryCandidate = registry.value as unknown as ProviderRegistryCandidate;
    if (
      typeof registryCandidate.languageModel !== 'function' ||
      typeof registryCandidate.embeddingModel !== 'function'
    ) {
      return err(new AppError('DOCS.AI_REGISTRY_INVALID'));
    }
    const languageModel = registryCandidate.languageModel.bind(registryCandidate);
    const embeddingModel = registryCandidate.embeddingModel.bind(registryCandidate);
    const aiRegistry: AIRegistry = {
      languageModel: (id) => languageModel(id),
      textEmbeddingModel: (id) => embeddingModel(id),
    };

    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);
    const resilience = new ResilienceService(loadResilienceConfig(), logger, eventBus);
    const embeddingService = new EmbeddingService(db, {
      config: config.value,
      resilience,
      registry: aiRegistry,
    });
    const ingestionService = new ContentIngestionService(embeddingService, {
      chunkingConfig: loadChunkingConfig(),
      logger,
      eventBus,
    });

    return ok({
      ingestionService,
      close: async () => {
        await pool.end();
      },
    });
  });
}
