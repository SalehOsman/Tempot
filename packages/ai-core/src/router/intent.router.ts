import { generateText, stepCountIs } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AITool, AIConfig } from '../ai-core.types.js';
import { truncateToolOutput } from '../tools/output-limiter.util.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { CASLToolFilter } from '../tools/casl-tool.filter.js';
import type {
  ConfirmationEngine,
  PendingConfirmation,
} from '../confirmation/confirmation.engine.js';
import type { RAGPipeline, RAGContext } from '../rag/rag-pipeline.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AIAbilityChecker, AILogger, AIRegistry } from '../ai-core.contracts.js';

/** Maximum number of agent loop steps */
const MAX_AGENT_STEPS = 5;

/** Parsed generation result (AI SDK v6 format) */
interface GenerationOutput {
  text: string;
  totalUsage: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  toolCalls: Array<{ toolName: string }>;
}

/** Intent routing result */
export interface IntentResult {
  response: string;
  toolsCalled: string[];
  tokenUsage: { input: number; output: number; total: number };
  requiresConfirmation?: {
    confirmationId: string;
    level: string;
    summary: string;
    details?: string;
    code?: string;
  };
}

/** Dependencies for IntentRouter constructor (max-params=3 compliance) */
export interface IntentRouterDeps {
  registry: AIRegistry;
  modelId: string;
  resilience: ResilienceService;
  caslFilter: CASLToolFilter;
  confirmationEngine: ConfirmationEngine;
  ragPipeline: RAGPipeline;
  auditService: AuditService;
  logger: AILogger;
  config?: AIConfig;
}

/** Options for the route method (max-params=3 compliance) */
export interface RouteOptions {
  message: string;
  userId: string;
  userRole: string;
  abilityChecker: AIAbilityChecker;
  systemPrompt: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Options for building messages (private helper) */
interface BuildMessagesOptions {
  systemPrompt: string;
  ragContext: RAGContext;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentMessage: string;
}

export class IntentRouter {
  /** Holds a pending confirmation if a tool triggered one during generation */
  private pendingConfirmation: PendingConfirmation | null = null;
  constructor(private readonly deps: IntentRouterDeps) {}

  /** Route a user message to appropriate tools or RAG */
  async route(options: RouteOptions): AsyncResult<IntentResult, AppError> {
    const { message, userId, abilityChecker, systemPrompt, conversationHistory } = options;
    const startTime = Date.now();

    // Reset pending confirmation state
    this.pendingConfirmation = null;

    const allowedTools = this.deps.caslFilter.filterForUser(abilityChecker);
    const ragContext = await this.retrieveRAGContext(options);
    const messages = this.buildMessages({
      systemPrompt,
      ragContext,
      history: conversationHistory,
      currentMessage: message,
    });
    const sdkTools = this.convertToSDKTools(allowedTools, userId);

    const generationResult = await this.executeGeneration(messages, sdkTools);

    // Check if a confirmation was triggered during tool execution
    // Note: pendingConfirmation is set inside convertToSDKTools callbacks during generation,
    // which TypeScript's CFA cannot track through async boundaries
    const confirmation = this.pendingConfirmation as PendingConfirmation | null;
    if (confirmation) {
      this.pendingConfirmation = null;
      return ok({
        response: `Action "${confirmation.toolName}" requires confirmation before execution.`,
        toolsCalled: [],
        tokenUsage: { input: 0, output: 0, total: 0 },
        requiresConfirmation: {
          confirmationId: confirmation.id,
          level: confirmation.level,
          summary: confirmation.summary,
          details: confirmation.details,
          code: confirmation.confirmationCode,
        },
      });
    }

    if (generationResult.isErr()) {
      return err(generationResult.error);
    }

    const output = generationResult.value;
    const tokenUsage = this.extractTokenUsage(output);

    this.auditLog({ userId, message, output, latencyMs: Date.now() - startTime, tokenUsage });

    return ok({
      response: output.text,
      toolsCalled: output.toolCalls?.map((tc) => tc.toolName) ?? [],
      tokenUsage,
    });
  }

  /** Retrieve RAG context with graceful degradation on failure */
  private async retrieveRAGContext(options: RouteOptions): Promise<RAGContext> {
    const ragResult = await this.deps.ragPipeline.retrieve({
      query: options.message,
      userRole: options.userRole,
      userId: options.userId,
    });
    return ragResult.isOk() ? ragResult.value : { hasResults: false, context: '', sources: [] };
  }

  /** Execute generation through resilience layer */
  private async executeGeneration(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    sdkTools: Record<string, unknown>,
  ): AsyncResult<GenerationOutput, AppError> {
    const result = await this.deps.resilience.executeGeneration(async () => {
      return generateText({
        model: this.deps.registry.languageModel(this.deps.modelId) as Parameters<
          typeof generateText
        >[0]['model'],
        messages,
        tools: sdkTools as Parameters<typeof generateText>[0]['tools'],
        stopWhen: stepCountIs(MAX_AGENT_STEPS),
      });
    });

    if (result.isErr()) {
      return err(result.error);
    }
    return ok(result.value as unknown as GenerationOutput);
  }

  /** Extract normalized token usage from generation output */
  private extractTokenUsage(output: GenerationOutput): IntentResult['tokenUsage'] {
    return {
      input: output.totalUsage?.inputTokens ?? 0,
      output: output.totalUsage?.outputTokens ?? 0,
      total: output.totalUsage?.totalTokens ?? 0,
    };
  }

  /** Fire-and-log audit entry */
  private auditLog(params: {
    userId: string;
    message: string;
    output: GenerationOutput;
    latencyMs: number;
    tokenUsage: IntentResult['tokenUsage'];
  }): void {
    void this.deps.auditService.log({
      userId: params.userId,
      action: 'generation',
      input: params.message,
      output: params.output.text,
      tokenUsage: params.tokenUsage,
      latencyMs: params.latencyMs,
      success: true,
    });
  }

  /** Build messages array for the model */
  private buildMessages(
    options: BuildMessagesOptions,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const { systemPrompt, ragContext, history, currentMessage } = options;
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    let system = systemPrompt;
    if (ragContext.hasResults) {
      system += `\n\nRelevant context from knowledge base:\n${ragContext.context}`;
    }
    messages.push({ role: 'system', content: system });

    for (const msg of history) {
      messages.push(msg);
    }
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /** Convert AITool to AI SDK tool format, with confirmation gate for write actions */
  private convertToSDKTools(tools: AITool[], userId: string): Record<string, unknown> {
    const sdkTools: Record<string, unknown> = {};
    for (const tool of tools) {
      sdkTools[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (params: unknown) => {
          // Gate write actions through confirmation engine (FR-006)
          if (tool.confirmationLevel !== 'none') {
            const confirmResult = this.deps.confirmationEngine.createConfirmation({
              userId,
              toolName: tool.name,
              params,
              level: tool.confirmationLevel,
              summary: tool.description,
            });
            if (confirmResult.isOk()) {
              this.pendingConfirmation = confirmResult.value;
              return `Action "${tool.name}" requires confirmation before execution. Confirmation ID: ${confirmResult.value.id}`;
            }
          }

          const result = await tool.execute(params);
          if (result.isErr()) {
            throw result.error;
          }
          const maxChars = tool.maxOutputChars ?? this.deps.config?.defaultMaxOutputChars ?? 4_000;
          return truncateToolOutput(result.value, maxChars);
        },
      };
    }
    return sdkTools;
  }
}
