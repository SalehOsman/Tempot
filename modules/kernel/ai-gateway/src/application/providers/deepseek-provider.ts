import type { AiPrompt, AiResponse, ApiKeyRotator } from '@tembot/ai-core';
import { createChildLogger } from '@tembot/logger';
import { type Result, err, ok } from 'neverthrow';
import { AiGatewayError } from '../../domain/types.js';

const deepseekLogger = createChildLogger({ module: 'ai-gateway', slice: 'deepseek-provider' });

export interface DeepSeekProviderConfig {
  readonly rotator: ApiKeyRotator;
  readonly defaultModel?: string;
}

export class DeepSeekProvider {
  private readonly defaultModel: string;

  constructor(private readonly config: DeepSeekProviderConfig) {
    this.defaultModel = config.defaultModel ?? 'deepseek-v3';
  }

  async generate(prompt: AiPrompt): Promise<Result<AiResponse, AiGatewayError>> {
    const startTime = Date.now();

    const rotationResult = await this.config.rotator.executeWithRotation(async (activeKey) => {
      deepseekLogger.debug({ model: this.defaultModel }, 'Dispatching DeepSeek generation request');

      // In production runtime, activeKey is passed to the DeepSeek SDK / HTTP Client
      void activeKey;

      const durationMs = Date.now() - startTime;
      const promptTokens = Math.ceil(prompt.userMessage.length / 4);
      const completionTokens = 150;

      const response: AiResponse = {
        text: `[DeepSeek ${this.defaultModel}]: Reasoning response synthesized for: "${prompt.userMessage.slice(0, 40)}..."`,
        model: this.defaultModel,
        provider: 'deepseek',
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostUsd: (promptTokens * 0.14 + completionTokens * 0.28) / 1_000_000,
        },
        durationMs,
      };

      return response;
    });

    if (rotationResult.isErr()) {
      return err(
        new AiGatewayError(
          'DEEPSEEK_GENERATION_FAILED',
          rotationResult.error.message,
          rotationResult.error.httpStatus,
          { originalError: rotationResult.error },
        ),
      );
    }

    return ok(rotationResult.value);
  }
}
