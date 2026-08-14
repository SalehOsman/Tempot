import { generateText } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { RAGPipeline } from '../rag/rag-pipeline.service.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { AIRegistry } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export interface ModuleReviewerDeps {
  ragPipeline: RAGPipeline;
  resilience: ResilienceService;
  registry: AIRegistry;
  modelId: string;
}

/** Single structured review check result */
export interface ReviewCheck {
  checkName: string;
  passed: boolean;
  detail: string;
}

/** Result of a structured module review */
export interface ReviewResult {
  moduleName: string;
  checks: ReviewCheck[];
  score: number;
}

const CHECK_NAMES = [
  'config-completeness',
  'missing-events',
  'ux-compliance',
  'i18n-completeness',
  'test-suggestions',
] as const;

export class ModuleReviewer {
  constructor(private readonly deps: ModuleReviewerDeps) {}

  /** Review a module for common issues using 5 structured checks */
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
        checks: [],
        score: 0,
      });
    }

    // 2. Generate structured review with context
    const reviewResult = await this.deps.resilience.executeGeneration(async () => {
      const { text } = await generateText({
        model: this.deps.registry.languageModel(this.deps.modelId),
        prompt: buildStructuredPrompt(moduleName, ragContext.context),
      });
      return text;
    });

    if (reviewResult.isErr()) {
      return err(new AppError(AI_ERRORS.PROVIDER_UNAVAILABLE, reviewResult.error));
    }

    // 3. Parse structured response
    const checks = parseStructuredResponse(reviewResult.value);

    return ok({
      moduleName,
      checks,
      score: checks.filter((c) => c.passed).length,
    });
  }
}

/** Build structured prompt requesting JSON output for 5 checks */
function buildStructuredPrompt(moduleName: string, context: string): string {
  return `Review the "${moduleName}" module based on the following documentation.

Context:
${context}

Evaluate these 5 checks and respond with ONLY a JSON object (no markdown, no code fences):

{
  "config-completeness": { "passed": true/false, "detail": "explanation" },
  "missing-events": { "passed": true/false, "detail": "explanation" },
  "ux-compliance": { "passed": true/false, "detail": "explanation" },
  "i18n-completeness": { "passed": true/false, "detail": "explanation" },
  "test-suggestions": { "passed": true/false, "detail": "explanation" }
}

Check definitions:
- config-completeness: Does the module have complete configuration with all required fields?
- missing-events: Does the module emit all expected events via the event bus?
- ux-compliance: Does the module follow UX patterns (loading states, error messages)?
- i18n-completeness: Are all user-facing strings using i18n keys?
- test-suggestions: Does the module have adequate test coverage?`;
}

/** Parse AI response JSON into ReviewCheck[]. Falls back to all-failed on parse error. */
function parseStructuredResponse(text: string): ReviewCheck[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      return buildFailedChecks('Invalid response format');
    }

    const record = parsed as Record<string, unknown>;
    const checks: ReviewCheck[] = [];

    for (const checkName of CHECK_NAMES) {
      const entry = record[checkName];
      if (
        entry !== null &&
        entry !== undefined &&
        typeof entry === 'object' &&
        'passed' in entry &&
        'detail' in entry
      ) {
        const typedEntry = entry as { passed: boolean; detail: string };
        checks.push({
          checkName,
          passed: Boolean(typedEntry.passed),
          detail: String(typedEntry.detail),
        });
      } else {
        checks.push({
          checkName,
          passed: false,
          detail: 'Check not evaluated',
        });
      }
    }

    return checks;
  } catch {
    return buildFailedChecks('Failed to parse AI response');
  }
}

/** Build all checks as failed with a given reason */
function buildFailedChecks(reason: string): ReviewCheck[] {
  return CHECK_NAMES.map((checkName) => ({
    checkName,
    passed: false,
    detail: reason,
  }));
}
