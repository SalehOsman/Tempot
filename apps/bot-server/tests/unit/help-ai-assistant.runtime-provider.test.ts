import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';

interface RegistryLike {
  splitId?: (id: string) => string;
  languageModel: (id: string) => unknown;
  embeddingModel: (id: string) => unknown;
}

interface CapturedAiRegistry {
  textEmbeddingModel: (id: string) => unknown;
}

const aiMocks = vi.hoisted(() => {
  const state: { capturedRegistry?: CapturedAiRegistry } = {};
  const embeddingModel = vi.fn((id: string) => ({ type: 'embedding', id }));
  const closePool = vi.fn();

  return {
    state,
    embeddingModel,
    closePool,
    Pool: vi.fn(function Pool() {
      return { end: closePool };
    }),
    drizzle: vi.fn(() => ({})),
    loadAIConfig: vi.fn(),
    createAIProviderRegistry: vi.fn(),
    loadResilienceConfig: vi.fn(() => ({})),
    ResilienceService: vi.fn(function ResilienceService() {
      return {};
    }),
    EmbeddingService: vi.fn(function EmbeddingService(
      _db: unknown,
      deps: { registry: CapturedAiRegistry },
    ) {
      state.capturedRegistry = deps.registry;
      return {};
    }),
    RAGPipeline: vi.fn(function RAGPipeline() {
      return {
        retrieve: async () => {
          state.capturedRegistry?.textEmbeddingModel('google:gemini-embedding-2-preview');
          return ok({ hasResults: false, context: '', sources: [] });
        },
      };
    }),
  };
});

vi.mock('pg', () => ({ Pool: aiMocks.Pool }));
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: aiMocks.drizzle }));
vi.mock('@tempot/ai-core', () => ({
  createAIProviderRegistry: aiMocks.createAIProviderRegistry,
  EmbeddingService: aiMocks.EmbeddingService,
  loadAIConfig: aiMocks.loadAIConfig,
  loadResilienceConfig: aiMocks.loadResilienceConfig,
  RAGPipeline: aiMocks.RAGPipeline,
  ResilienceService: aiMocks.ResilienceService,
}));

describe('help AI assistant runtime provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiMocks.state.capturedRegistry = undefined;
    process.env.DATABASE_URL = 'postgresql://tempot:tempot_password@localhost:5432/tempot_db';
    aiMocks.loadAIConfig.mockReturnValue(ok({ enabled: true, embeddingModel: 'gemini' }));
    aiMocks.createAIProviderRegistry.mockReturnValue(ok(buildProviderRegistry()));
  });

  it('adapts provider embeddingModel to the internal textEmbeddingModel contract', async () => {
    const { buildHelpAiAssistantProvider } =
      await import('../../src/startup/help-ai-assistant.provider.js');
    const provider = buildHelpAiAssistantProvider({
      logger: createLogger(),
      eventBus: { publish: async () => ({ isOk: () => true }) },
    });

    await provider.ask({
      question: 'How does help work?',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(aiMocks.embeddingModel).toHaveBeenCalledWith('google:gemini-embedding-2-preview');
  });
});

function buildProviderRegistry(): RegistryLike {
  return {
    splitId: (id) => id,
    languageModel: (id) => ({ type: 'language', id }),
    embeddingModel(id) {
      if (!this.splitId) throw new Error('missing registry context');
      return aiMocks.embeddingModel(this.splitId(id));
    },
  };
}

function createLogger() {
  return {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    child: () => createLogger(),
  };
}
