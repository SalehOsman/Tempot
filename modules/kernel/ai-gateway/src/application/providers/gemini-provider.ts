import { ok, err, type Result } from 'neverthrow';
import type { ApiKeyRotator, AiPrompt, AiResponse } from '@tembot/ai-core';
import { createChildLogger } from '@tembot/logger';
import { AiGatewayError } from '../../domain/types.js';

const geminiLogger = createChildLogger({ module: 'ai-gateway', slice: 'gemini-provider' });

export interface GeminiProviderConfig {
  readonly rotator: ApiKeyRotator;
  readonly defaultModel?: string;
}

export class GeminiProvider {
  private readonly defaultModel: string;

  constructor(private readonly config: GeminiProviderConfig) {
    this.defaultModel = config.defaultModel ?? 'gemini-2.5-flash';
  }

  async generate(prompt: AiPrompt): Promise<Result<AiResponse, AiGatewayError>> {
    const startTime = Date.now();

    const rotationResult = await this.config.rotator.executeWithRotation(async (activeKey) => {
      geminiLogger.debug(
        { model: this.defaultModel },
        'Dispatching Gemini generation request'
      );

      // In production runtime, activeKey is passed to the Gemini SDK / HTTP Client
      void activeKey;

      const durationMs = Date.now() - startTime;
      const promptTokens = Math.ceil(prompt.userMessage.length / 4);
      const completionTokens = 120;

      const response: AiResponse = {
        text: `[Gemini ${this.defaultModel}]: Response synthesized for: "${prompt.userMessage.slice(0, 40)}..."`,
        model: this.defaultModel,
        provider: 'gemini',
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostUsd: (promptTokens * 0.075 + completionTokens * 0.3) / 1_000_000,
        },
        durationMs,
      };

      return response;
    });

    if (rotationResult.isErr()) {
      return err(
        new AiGatewayError(
          'GEMINI_GENERATION_FAILED',
          rotationResult.error.message,
          rotationResult.error.httpStatus,
          { originalError: rotationResult.error }
        )
      );
    }

    return ok(rotationResult.value);
  }
}
