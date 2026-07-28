import { existsSync } from 'node:fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ok } from 'neverthrow';
import type { AIEventBus, AILogger, AIRegistry } from '@tempot/ai-core';
import type { ModuleEventBus, ModuleLogger } from '../bot-server.types.js';
import type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';
import { discoverMarkdownFiles, readKnowledgeTextFile } from './knowledge-file-discovery.js';
import {
  loadCustomKnowledgeProfiles,
  saveCustomKnowledgeProfiles,
} from './knowledge-custom-profiles.store.js';

type ProviderRegistryCandidate = {
  languageModel?: AIRegistry['languageModel'];
  embeddingModel?: AIRegistry['textEmbeddingModel'];
};

export function liveKnowledgeDeps(opts: {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
}): KnowledgeProviderDeps {
  return {
    aiEnabled: () => process.env['TEMPOT_AI'] !== 'false',
    providerConfigured: () => Boolean(process.env['GOOGLE_GENERATIVE_AI_API_KEY']),
    databaseConfigured: () => Boolean(process.env['DATABASE_URL']),
    vectorReady: () =>
      queryBoolean("select exists (select 1 from pg_extension where extname = 'vector')"),
    countEmbeddings: () => queryNumber('select count(*) as count from embeddings'),
    pathExists: async (rootPath) => existsSync(rootPath),
    discoverMarkdownFiles,
    readTextFile: readKnowledgeTextFile,
    chunkMarkdown: async (content, filePath) => {
      const aiCore = await import('@tempot/ai-core');
      return aiCore.chunkMarkdown(content, { filePath });
    },
    ingestContent: (input) => ingestLive(input, opts),
    loadCustomProfiles: () => loadCustomKnowledgeProfiles(opts.logger),
    saveCustomProfiles: saveCustomKnowledgeProfiles,
    logger: opts.logger,
  };
}

async function ingestLive(
  input: Parameters<KnowledgeProviderDeps['ingestContent']>[0],
  opts: { logger: ModuleLogger; eventBus: ModuleEventBus },
): Promise<void> {
  const aiCore = await import('@tempot/ai-core');
  const runtime = await createIngestionRuntime(opts, aiCore);
  try {
    const result = await runtime.service.ingest({ ...input, source: 'manual', strict: true });
    if (result.isErr()) throw result.error;
  } finally {
    await runtime.close();
  }
}

async function createIngestionRuntime(
  opts: { logger: ModuleLogger; eventBus: ModuleEventBus },
  aiCore: typeof import('@tempot/ai-core'),
) {
  const config = aiCore.loadAIConfig();
  if (config.isErr()) throw config.error;
  const registry = aiCore.createAIProviderRegistry(config.value);
  if (registry.isErr()) throw registry.error;
  const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
  const db = drizzle(pool);
  const resilience = new aiCore.ResilienceService(
    aiCore.loadResilienceConfig(),
    toAiLogger(opts.logger),
    toAiEventBus(opts.eventBus),
  );
  const embeddingService = new aiCore.EmbeddingService(db, {
    config: config.value,
    resilience,
    registry: toAiRegistry(registry.value),
  });
  return {
    service: new aiCore.ContentIngestionService(embeddingService, {
      chunkingConfig: aiCore.loadChunkingConfig(),
      logger: toAiLogger(opts.logger),
      eventBus: toAiEventBus(opts.eventBus),
    }),
    close: () => pool.end(),
  };
}

async function queryNumber(sql: string): Promise<number> {
  const value = await queryScalar(sql);
  return typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
}

async function queryBoolean(sql: string): Promise<boolean> {
  return Boolean(await queryScalar(sql));
}

async function queryScalar(sql: string): Promise<unknown> {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
  try {
    const result = await pool.query(sql);
    return Object.values(result.rows[0] ?? {})[0];
  } finally {
    await pool.end();
  }
}

function toAiRegistry(registry: unknown): AIRegistry {
  const candidate = registry as ProviderRegistryCandidate;
  if (typeof candidate.languageModel !== 'function') {
    throw new Error('bot-server.ai.registry_invalid');
  }
  if (typeof candidate.embeddingModel !== 'function') {
    throw new Error('bot-server.ai.registry_invalid');
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
      await eventBus.publish(event, toRecordPayload(payload));
      return ok(undefined);
    },
    subscribe: () => undefined,
  };
}

function toRecordPayload(payload: unknown): Record<string, unknown> {
  if (isRecord(payload)) return payload;
  return { payload };
}

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}
