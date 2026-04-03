import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

// --- Mock: ai module ---
const mockGenerateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

// --- Mock factories ---
function createMockEmbeddingService() {
  return {
    embedAndStore: vi.fn(async () => ok('embedding-id')),
    searchSimilar: vi.fn(async () => ok([])),
  };
}

function createMockResilience() {
  return {
    executeGeneration: vi.fn(async (fn: () => Promise<unknown>) => {
      try {
        const result = await fn();
        return ok(result);
      } catch (e) {
        return err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, e));
      }
    }),
  };
}

function createMockEventBus() {
  return {
    publish: vi.fn(async () => ok(undefined)),
    subscribe: vi.fn(),
  };
}

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function createMockRegistry() {
  return {
    languageModel: vi.fn().mockReturnValue('mock-model'),
    textEmbeddingModel: vi.fn().mockReturnValue('mock-embedding-model'),
  };
}

describe('ConversationMemory', () => {
  let service: InstanceType<
    (typeof import('../../src/memory/conversation-memory.service.js'))['ConversationMemory']
  >;
  let embeddingService: ReturnType<typeof createMockEmbeddingService>;
  let resilience: ReturnType<typeof createMockResilience>;
  let eventBus: ReturnType<typeof createMockEventBus>;
  let logger: ReturnType<typeof createMockLogger>;
  let registry: ReturnType<typeof createMockRegistry>;

  beforeEach(async () => {
    vi.clearAllMocks();
    embeddingService = createMockEmbeddingService();
    resilience = createMockResilience();
    eventBus = createMockEventBus();
    logger = createMockLogger();
    registry = createMockRegistry();

    mockGenerateText.mockResolvedValue({ text: 'Summary of conversation' });

    const { ConversationMemory } = await import('../../src/memory/conversation-memory.service.js');

    service = new ConversationMemory({
      embeddingService: embeddingService as never,
      resilience: resilience as never,
      registry,
      modelId: 'gemini-2.0-flash',
      logger: logger as never,
      eventBus: eventBus as never,
    });
  });

  describe('summarizeAndStore', () => {
    it('generates summary and embeds it', async () => {
      const result = await service.summarizeAndStore({
        userId: 'user-1',
        sessionId: 'session-1',
        conversation: [
          { role: 'user', content: 'Hello, I need help with my order' },
          { role: 'assistant', content: 'Sure, I can help. What is your order number?' },
          { role: 'user', content: 'Order #12345' },
        ],
      });

      expect(result.isOk()).toBe(true);

      // Verify resilience was used for generation
      expect(resilience.executeGeneration).toHaveBeenCalledOnce();

      // Verify generateText was called (through resilience callback)
      expect(mockGenerateText).toHaveBeenCalledOnce();

      // Verify embedding was stored with correct data
      expect(embeddingService.embedAndStore).toHaveBeenCalledOnce();
      expect(embeddingService.embedAndStore).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: 'session:session-1',
          contentType: 'user-memory',
          content: 'Summary of conversation',
          metadata: expect.objectContaining({
            userId: 'user-1',
            sessionId: 'session-1',
            messageCount: 3,
          }),
        }),
      );
    });

    it('returns ok(undefined) immediately for empty conversation', async () => {
      const result = await service.summarizeAndStore({
        userId: 'user-1',
        sessionId: 'session-empty',
        conversation: [],
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();

      // Nothing should be called for empty conversation
      expect(resilience.executeGeneration).not.toHaveBeenCalled();
      expect(embeddingService.embedAndStore).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('returns err(SUMMARIZATION_FAILED) on summarization failure', async () => {
      resilience.executeGeneration.mockResolvedValue(
        err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, new Error('AI provider down'))),
      );

      const result = await service.summarizeAndStore({
        userId: 'user-1',
        sessionId: 'session-fail',
        conversation: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.SUMMARIZATION_FAILED);

      // Embedding should not be attempted after generation failure
      expect(embeddingService.embedAndStore).not.toHaveBeenCalled();
    });

    it('returns err(SUMMARIZATION_FAILED) on embedding failure', async () => {
      embeddingService.embedAndStore.mockResolvedValue(
        err(new AppError(AI_ERRORS.EMBEDDING_FAILED, new Error('Vector store down'))),
      );

      const result = await service.summarizeAndStore({
        userId: 'user-1',
        sessionId: 'session-embed-fail',
        conversation: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.SUMMARIZATION_FAILED);

      // Event should not be emitted on failure
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('emits ai-core.conversation.ended event on success', async () => {
      await service.summarizeAndStore({
        userId: 'user-1',
        sessionId: 'session-event',
        conversation: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'Reply' },
        ],
      });

      expect(eventBus.publish).toHaveBeenCalledOnce();
      expect(eventBus.publish).toHaveBeenCalledWith(
        'ai-core.conversation.ended',
        expect.objectContaining({
          userId: 'user-1',
          messageCount: 2,
          summarized: true,
        }),
      );
    });
  });

  describe('retrievePastContext', () => {
    it('returns matching memory content IDs', async () => {
      embeddingService.searchSimilar.mockResolvedValue(
        ok([
          {
            contentId: 'session:prev-1',
            contentType: 'user-memory',
            score: 0.85,
            metadata: { userId: 'user-1' },
          },
          {
            contentId: 'session:prev-2',
            contentType: 'user-memory',
            score: 0.72,
            metadata: { userId: 'user-1' },
          },
        ]),
      );

      const result = await service.retrievePastContext({
        userId: 'user-1',
        currentQuery: 'order tracking help',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(['session:prev-1', 'session:prev-2']);

      // Verify search was called with correct params
      expect(embeddingService.searchSimilar).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'order tracking help',
          contentTypes: ['user-memory'],
          limit: 5,
          confidenceThreshold: 0.5,
        }),
      );
    });

    it('isolates results by userId - only requesting user memories returned', async () => {
      embeddingService.searchSimilar.mockResolvedValue(
        ok([
          {
            contentId: 'session:user1-memory',
            contentType: 'user-memory',
            score: 0.9,
            metadata: { userId: 'user-1' },
          },
          {
            contentId: 'session:user2-memory',
            contentType: 'user-memory',
            score: 0.88,
            metadata: { userId: 'user-2' },
          },
          {
            contentId: 'session:user1-memory-2',
            contentType: 'user-memory',
            score: 0.75,
            metadata: { userId: 'user-1' },
          },
        ]),
      );

      const result = await service.retrievePastContext({
        userId: 'user-1',
        currentQuery: 'previous help',
      });

      expect(result.isOk()).toBe(true);
      const contentIds = result._unsafeUnwrap();
      expect(contentIds).toEqual(['session:user1-memory', 'session:user1-memory-2']);
      expect(contentIds).not.toContain('session:user2-memory');
    });

    it('returns err(RAG_SEARCH_FAILED) on search failure', async () => {
      embeddingService.searchSimilar.mockResolvedValue(
        err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, new Error('Search failed'))),
      );

      const result = await service.retrievePastContext({
        userId: 'user-1',
        currentQuery: 'some query',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_SEARCH_FAILED);
    });

    it('respects custom limit parameter', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await service.retrievePastContext({
        userId: 'user-1',
        currentQuery: 'query',
        limit: 3,
      });

      expect(embeddingService.searchSimilar).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 3,
        }),
      );
    });
  });
});
