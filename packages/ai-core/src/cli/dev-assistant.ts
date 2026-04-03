import { generateText } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { RAGPipeline } from '../rag/rag-pipeline.service.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { AIRegistry } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export interface DevAssistantDeps {
  ragPipeline: RAGPipeline;
  resilience: ResilienceService;
  registry: AIRegistry;
  modelId: string;
}

export interface DevAssistantResult {
  answer: string;
  sources: string[];
}

export class DevAssistant {
  constructor(private readonly deps: DevAssistantDeps) {}

  /** Answer a developer question using RAG context */
  async ask(question: string): AsyncResult<DevAssistantResult, AppError> {
    // 1. Retrieve RAG context for developer-docs
    const ragResult = await this.deps.ragPipeline.retrieve({
      query: question,
      userRole: 'developer',
      userId: 'cli',
    });

    if (ragResult.isErr()) {
      return err(ragResult.error);
    }

    const ragContext = ragResult.value;

    if (!ragContext.hasResults) {
      return ok({
        answer:
          'No relevant documentation found. Try rephrasing your question or check if developer docs have been indexed.',
        sources: [],
      });
    }

    // 2. Generate answer with RAG context
    const generationResult = await this.deps.resilience.executeGeneration(async () => {
      const { text } = await generateText({
        model: this.deps.registry.languageModel(this.deps.modelId),
        prompt: `Based on the following documentation context, answer the developer question.\n\nContext:\n${ragContext.context}\n\nQuestion: ${question}\n\nProvide a concise, technically accurate answer.`,
      });
      return text;
    });

    if (generationResult.isErr()) {
      return err(new AppError(AI_ERRORS.PROVIDER_UNAVAILABLE, generationResult.error));
    }

    return ok({
      answer: generationResult.value,
      sources: ragContext.sources.map((s) => s.contentId),
    });
  }
}
