import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Dependencies for ConversationMemory (max-params = 3 compliance) */
export interface ConversationMemoryDeps {
  embeddingService: EmbeddingService;
  resilience: ResilienceService;
  registry: unknown;
  modelId: string;
  logger: AILogger;
  eventBus: AIEventBus;
}

/** Options for summarizing and storing a conversation */
export interface SummarizeOptions {
  userId: string;
  sessionId: string;
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Options for retrieving past context */
export interface RetrieveContextOptions {
  userId: string;
  currentQuery: string;
  limit?: number;
}

export class ConversationMemory {
  private readonly deps: ConversationMemoryDeps;

  constructor(deps: ConversationMemoryDeps) {
    this.deps = deps;
  }

  /** Summarize and store a completed conversation */
  async summarizeAndStore(options: SummarizeOptions): AsyncResult<void, AppError> {
    if (options.conversation.length === 0) {
      return ok(undefined);
    }

    // 1. Generate summary via resilience
    const summaryResult = await this.deps.resilience.executeGeneration(async () => {
      const conversationText = options.conversation
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
      const { text } = await generateText({
        model: (
          this.deps.registry as { languageModel: (id: string) => LanguageModel }
        ).languageModel(this.deps.modelId),
        prompt: `Summarize the following conversation concisely, focusing on key topics, decisions, and user preferences. Keep the summary under 200 words.\n\n${conversationText}`,
      });
      return text;
    });

    if (summaryResult.isErr()) {
      return err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, summaryResult.error));
    }

    // 2. Embed and store the summary
    const embedResult = await this.deps.embeddingService.embedAndStore({
      contentId: `session:${options.sessionId}`,
      contentType: 'user-memory',
      content: summaryResult.value,
      metadata: {
        userId: options.userId,
        sessionId: options.sessionId,
        summarizedAt: new Date().toISOString(),
        messageCount: options.conversation.length,
      },
    });

    if (embedResult.isErr()) {
      return err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, embedResult.error));
    }

    // 3. Emit conversation ended event (fire-and-log)
    void this.deps.eventBus.publish('ai-core.conversation.ended', {
      userId: options.userId,
      messageCount: options.conversation.length,
      summarized: true,
      durationMs: 0,
    });

    return ok(undefined);
  }

  /** Retrieve relevant past context for a new session */
  async retrievePastContext(options: RetrieveContextOptions): AsyncResult<string[], AppError> {
    const searchResult = await this.deps.embeddingService.searchSimilar({
      query: options.currentQuery,
      contentTypes: ['user-memory'],
      limit: options.limit ?? 5,
      confidenceThreshold: 0.5,
    });

    if (searchResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, searchResult.error));
    }

    // Filter to this user's memories only
    const userMemories = searchResult.value.filter(
      (r) => (r.metadata as Record<string, unknown> | null)?.userId === options.userId,
    );

    return ok(userMemories.map((m) => m.contentId));
  }
}
