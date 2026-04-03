import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import type { EmbeddingSearchResult } from '../../src/ai-core.types.js';
import { DevAssistant } from '../../src/cli/dev-assistant.js';
import type { DevAssistantDeps } from '../../src/cli/dev-assistant.js';
import type { RAGContext } from '../../src/rag/rag-pipeline.service.js';

// --- Mock: generateText from 'ai' ---
const mockGenerateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

// --- Mock factories ---
function createMockRAGPipeline() {
  return {
    retrieve: vi.fn(),
  };
}

function createMockResilience() {
  return {
    executeGeneration: vi.fn(),
    executeEmbedding: vi.fn(),
    isCircuitOpen: vi.fn().mockReturnValue(false),
  };
}

function createMockRegistry() {
  return {
    languageModel: vi.fn().mockReturnValue('mock-model'),
    textEmbeddingModel: vi.fn().mockReturnValue('mock-embedding-model'),
  };
}

// --- Test data ---
const devDocSources: EmbeddingSearchResult[] = [
  {
    contentId: 'doc-architecture',
    contentType: 'developer-docs',
    score: 0.92,
    metadata: { title: 'Architecture Guide' },
  },
  {
    contentId: 'doc-api-ref',
    contentType: 'developer-docs',
    score: 0.85,
    metadata: { title: 'API Reference' },
  },
];

const ragContextWithResults: RAGContext = {
  hasResults: true,
  context:
    '[developer-docs] Architecture Guide: (score: 0.92)\n\n[developer-docs] API Reference: (score: 0.85)',
  sources: devDocSources,
};

const ragContextEmpty: RAGContext = {
  hasResults: false,
  context: '',
  sources: [],
};

describe('DevAssistant', () => {
  let assistant: DevAssistant;
  let ragPipeline: ReturnType<typeof createMockRAGPipeline>;
  let resilience: ReturnType<typeof createMockResilience>;
  let registry: ReturnType<typeof createMockRegistry>;

  beforeEach(() => {
    vi.clearAllMocks();
    ragPipeline = createMockRAGPipeline();
    resilience = createMockResilience();
    registry = createMockRegistry();

    const deps: DevAssistantDeps = {
      ragPipeline: ragPipeline as never,
      resilience: resilience as never,
      registry,
      modelId: 'gemini-2.0-flash',
    };
    assistant = new DevAssistant(deps);
  });

  it('returns formatted answer with sources when RAG finds results', async () => {
    ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
    resilience.executeGeneration.mockImplementation(async (fn: () => Promise<string>) => {
      const text = await fn();
      return ok(text);
    });
    mockGenerateText.mockResolvedValue({ text: 'The architecture uses a modular pattern.' });

    const result = await assistant.ask('How is the project structured?');

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.answer).toBe('The architecture uses a modular pattern.');
    expect(value.sources).toEqual(['doc-architecture', 'doc-api-ref']);

    // Verify RAG was called with developer role
    expect(ragPipeline.retrieve).toHaveBeenCalledWith({
      query: 'How is the project structured?',
      userRole: 'developer',
      userId: 'cli',
    });
  });

  it('returns helpful message when no RAG results found', async () => {
    ragPipeline.retrieve.mockResolvedValue(ok(ragContextEmpty));

    const result = await assistant.ask('Something totally unrelated');

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.answer).toContain('No relevant documentation found');
    expect(value.sources).toEqual([]);

    // Should NOT call generation when no results
    expect(resilience.executeGeneration).not.toHaveBeenCalled();
  });
});
