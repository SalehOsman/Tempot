import type { AiResponse, JevClient, JevDecisionResult } from '@tembot/ai-core';
import { createChildLogger } from '@tembot/logger';
import type { AuditService, ErrorRecorder } from '@tembot/module-audit-log';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { type Result, err, ok } from 'neverthrow';
import { aiUsageLogs } from '../db/schema.js';
import { AiGatewayError, type AiGatewayPort, type AiGenerationRequest } from '../domain/types.js';
import type { DeepSeekProvider } from './providers/deepseek-provider.js';
import type { GeminiProvider } from './providers/gemini-provider.js';

const gatewayLogger = createChildLogger({ module: 'ai-gateway', slice: 'service' });

export interface AiGatewayDependencies {
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container accepts any schema mapping
  readonly db: PgDatabase<any>;
  readonly jevClient: JevClient;
  readonly geminiProvider: GeminiProvider;
  readonly deepseekProvider: DeepSeekProvider;
  readonly auditService?: AuditService;
  readonly errorRecorder?: ErrorRecorder;
}

export class AiGatewayService implements AiGatewayPort {
  constructor(private readonly deps: AiGatewayDependencies) {}

  /**
   * System One: Fast deterministic decision scoring via TypeSafe AI jev.
   */
  async evaluateDecision<TDecision>(
    state: Record<string, unknown> | string,
    options: {
      readonly confidenceThreshold?: number;
      readonly tenantId?: string;
      readonly actorId?: string;
    } = {},
  ): Promise<Result<JevDecisionResult<TDecision>, AiGatewayError>> {
    const startTime = Date.now();
    const tenantId = options.tenantId ?? '00000000-0000-0000-0000-000000000000';
    const actorId = options.actorId ?? 'system:system-one';

    const evalResult = await this.deps.jevClient.evaluateDecision<TDecision>(
      state,
      undefined,
      options.confidenceThreshold ?? 0.9,
    );

    const durationMs = Date.now() - startTime;

    if (evalResult.isErr()) {
      const errorObj = new AiGatewayError(
        'JEV_EVALUATION_FAILED',
        evalResult.error.message,
        evalResult.error.httpStatus,
        { originalError: evalResult.error },
      );

      if (this.deps.errorRecorder) {
        this.deps.errorRecorder.captureError({
          tenantId,
          actorId,
          action: 'ai.evaluate_decision',
          error: errorObj,
          metadata: { durationMs },
        });
      }

      return err(errorObj);
    }

    const evaluation = evalResult.value;

    // Asynchronously persist usage telemetry without blocking the fast path
    this.deps.db
      .insert(aiUsageLogs)
      .values({
        tenantId,
        actorId,
        tier: 'SYSTEM_ONE',
        provider: 'typesafe-jev',
        model: 'jev-classifier-v1',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: '0.00010000',
        latencyMs: durationMs,
        fallbackOccurred: false,
        status: 'SUCCESS',
        metadata: {
          confidence: evaluation.confidence,
          isHighConfidence: evaluation.isHighConfidence,
          category: evaluation.category,
        },
      })
      .catch((err) => gatewayLogger.warn({ err }, 'Failed to write jev usage log'));

    return ok(evaluation);
  }

  /**
   * System Two: Generative response synthesis with multi-key failover and provider fallback.
   */
  async generateResponse(
    request: AiGenerationRequest,
  ): Promise<Result<AiResponse, AiGatewayError>> {
    const startTime = Date.now();
    const primaryTier = request.preferredTier ?? 'fast';

    gatewayLogger.info(
      { tenantId: request.tenantId, actorId: request.actorId, primaryTier },
      'Generating AI conversational response',
    );

    let fallbackOccurred = false;
    let result: Result<AiResponse, AiGatewayError>;

    if (primaryTier === 'reasoning') {
      // 1. Try DeepSeek (reasoning)
      result = await this.deps.deepseekProvider.generate(request.prompt);

      // 2. Fallback to Gemini if DeepSeek fails
      if (result.isErr()) {
        gatewayLogger.warn(
          { error: result.error.message },
          'DeepSeek reasoning tier failed, falling back to Gemini fast tier',
        );
        fallbackOccurred = true;
        result = await this.deps.geminiProvider.generate(request.prompt);
      }
    } else {
      // 1. Try Gemini (fast)
      result = await this.deps.geminiProvider.generate(request.prompt);

      // 2. Fallback to DeepSeek if Gemini fails
      if (result.isErr()) {
        gatewayLogger.warn(
          { error: result.error.message },
          'Gemini fast tier failed, falling back to DeepSeek tier',
        );
        fallbackOccurred = true;
        result = await this.deps.deepseekProvider.generate(request.prompt);
      }
    }

    const durationMs = Date.now() - startTime;

    if (result.isErr()) {
      if (this.deps.errorRecorder) {
        this.deps.errorRecorder.captureError({
          tenantId: request.tenantId,
          actorId: request.actorId,
          action: 'ai.generate_response',
          error: result.error,
          metadata: { durationMs, fallbackOccurred },
        });
      }
      return result;
    }

    const aiRes = result.value;

    // Record telemetry in DB
    this.deps.db
      .insert(aiUsageLogs)
      .values({
        tenantId: request.tenantId,
        actorId: request.actorId,
        tier: 'SYSTEM_TWO',
        provider: aiRes.provider,
        model: aiRes.model,
        promptTokens: aiRes.tokenUsage.promptTokens,
        completionTokens: aiRes.tokenUsage.completionTokens,
        totalTokens: aiRes.tokenUsage.totalTokens,
        costUsd: (aiRes.tokenUsage.estimatedCostUsd ?? 0).toFixed(8),
        latencyMs: durationMs,
        fallbackOccurred,
        status: 'SUCCESS',
        metadata: {
          preferredTier: primaryTier,
          durationMs,
        },
      })
      .catch((err) => gatewayLogger.warn({ err }, 'Failed to persist ai usage log'));

    return ok(aiRes);
  }
}
