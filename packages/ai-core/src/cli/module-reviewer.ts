import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { RAGPipeline } from '../rag/rag-pipeline.service.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export interface ModuleReviewerDeps {
  ragPipeline: RAGPipeline;
  resilience: ResilienceService;
  registry: unknown;
  modelId: string;
}

export interface ReviewResult {
  moduleName: string;
  issues: string[];
  summary: string;
}

export class ModuleReviewer {
  constructor(private readonly deps: ModuleReviewerDeps) {}

  /** Review a module for common issues using developer docs as reference */
  async review(moduleName: string): AsyncResult<ReviewResult, AppError> {
    // 1. Retrieve module docs from RAG
    const ragResult = await this.deps.ragPipeline.retrieve({
      query: `${moduleName} module architecture patterns issues`,
      userRole: 'developer',
      userId: 'cli',
    });

    if (ragResult.isErr()) {
      return err(ragResult.error);
    }

    const ragContext = ragResult.value;

    if (!ragContext.hasResults) {
      return ok({
        moduleName,
        issues: [],
        summary: `No documentation found for module "${moduleName}". Index developer docs first.`,
      });
    }

    // 2. Generate review with context
    const reviewResult = await this.deps.resilience.executeGeneration(async () => {
      const { text } = await generateText({
        model: (
          this.deps.registry as { languageModel: (id: string) => LanguageModel }
        ).languageModel(this.deps.modelId),
        prompt: `Review the "${moduleName}" module based on the following documentation and architecture patterns.\n\nContext:\n${ragContext.context}\n\nList any potential issues, one per line prefixed with "- ". If no issues found, respond with "No issues found."`,
      });
      return text;
    });

    if (reviewResult.isErr()) {
      return err(new AppError(AI_ERRORS.PROVIDER_UNAVAILABLE, reviewResult.error));
    }

    const text = reviewResult.value;
    const issues = text.includes('No issues found')
      ? []
      : text
          .split('\n')
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.trim().slice(2).trim());

    return ok({
      moduleName,
      issues,
      summary:
        issues.length === 0 ? 'Clean — no issues found.' : `Found ${issues.length} issue(s).`,
    });
  }
}
