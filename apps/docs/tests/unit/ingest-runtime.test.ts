import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';

interface RegistryLike {
  languageModel: (id: string) => unknown;
  textEmbeddingModel: (id: string) => unknown;
}

const aiCoreMocks = vi.hoisted(() => {
  const state: { capturedRegistry?: RegistryLike } = {};
  const languageModel = vi.fn((id: string) => ({ type: 'language', id }));
  const embeddingModel = vi.fn((id: string) => ({ type: 'embedding', id }));
  const closePool = vi.fn();

  return {
    state,
    languageModel,
    embeddingModel,
    closePool,
    createAIProviderRegistry: vi.fn(),
    loadAIConfig: vi.fn(),
    loadChunkingConfig: vi.fn(() => ({})),
    loadResilienceConfig: vi.fn(() => ({})),
    guardEnabled: vi.fn(async (_enabled: boolean, factory: () => unknown) => factory()),
    Pool: vi.fn(function Pool() {
      return { end: closePool };
    }),
    drizzle: vi.fn(() => ({})),
    ResilienceService: vi.fn(function ResilienceService() {
      return {};
    }),
    EmbeddingService: vi.fn(function EmbeddingService(
      _db: unknown,
      deps: { registry: RegistryLike },
    ) {
      state.capturedRegistry = deps.registry;
      return {};
    }),
    ContentIngestionService: vi.fn(function ContentIngestionService() {
      return {};
    }),
  };
});

vi.mock('pg', () => ({
  Pool: aiCoreMocks.Pool,
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: aiCoreMocks.drizzle,
}));

vi.mock('@tempot/ai-core', () => ({
  ContentIngestionService: aiCoreMocks.ContentIngestionService,
  createAIProviderRegistry: aiCoreMocks.createAIProviderRegistry,
  EmbeddingService: aiCoreMocks.EmbeddingService,
  guardEnabled: aiCoreMocks.guardEnabled,
  loadAIConfig: aiCoreMocks.loadAIConfig,
  loadChunkingConfig: aiCoreMocks.loadChunkingConfig,
  loadResilienceConfig: aiCoreMocks.loadResilienceConfig,
  ResilienceService: aiCoreMocks.ResilienceService,
}));

describe('createDocsIngestionRuntime', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    aiCoreMocks.state.capturedRegistry = undefined;
    process.env.DATABASE_URL = 'postgresql://tempot:tempot_password@localhost:5432/tempot_db';
    aiCoreMocks.loadAIConfig.mockReturnValue(
      ok({
        enabled: true,
        provider: 'gemini',
        embeddingModel: 'gemini-embedding-2-preview',
        embeddingDimensions: 3072,
        confidenceThreshold: 0.7,
        generationTimeoutMs: 30_000,
        embeddingTimeoutMs: 10_000,
        defaultMaxOutputChars: 4000,
      }),
    );
    aiCoreMocks.createAIProviderRegistry.mockReturnValue(
      ok({
        splitId: (id: string) => id,
        languageModel(this: { splitId?: (id: string) => string }, id: string) {
          if (!this.splitId) throw new Error('missing registry context');
          return aiCoreMocks.languageModel(this.splitId(id));
        },
        embeddingModel(this: { splitId?: (id: string) => string }, id: string) {
          if (!this.splitId) throw new Error('missing registry context');
          return aiCoreMocks.embeddingModel(this.splitId(id));
        },
      } as unknown),
    );
  });

  it('adapts provider registry embeddingModel to the internal AIRegistry contract', async () => {
    const { createDocsIngestionRuntime } = await import('../../scripts/ingest-runtime.js');

    const result = await createDocsIngestionRuntime();

    expect(result.isOk()).toBe(true);
    expect(aiCoreMocks.state.capturedRegistry).toBeDefined();
    aiCoreMocks.state.capturedRegistry?.textEmbeddingModel('google:gemini-embedding-2-preview');
    expect(aiCoreMocks.embeddingModel).toHaveBeenCalledWith('google:gemini-embedding-2-preview');
  });
});
