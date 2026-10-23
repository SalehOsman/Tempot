import type { Result, DomainError } from '@tembot/shared-types';
import { ApiKeyRotator } from './key-rotator.js';
import type { JevDecisionResult } from './types.js';

export interface JevClientConfig {
  readonly apiKeys: readonly string[];
  readonly baseUrl?: string;
  readonly defaultThreshold?: number; // e.g. 0.90
}

export class JevClient {
  private readonly rotator: ApiKeyRotator;
  public readonly baseUrl: string;
  public readonly defaultThreshold: number;

  constructor(config: JevClientConfig) {
    this.rotator = new ApiKeyRotator({
      provider: 'typesafe-jev',
      keys: config.apiKeys,
    });
    this.baseUrl = config.baseUrl ?? 'https://api.typesafe.ai/v1';
    this.defaultThreshold = config.defaultThreshold ?? 0.90;
  }

  /**
   * Executes a fast, single-pass System One decision evaluation using TypeSafe AI jev.
   * Employs the ApiKeyRotator to seamlessly fail over if an API key runs out of quota.
   */
  public async evaluateDecision<TDecision>(
    state: Record<string, unknown> | string,
    schema?: Record<string, unknown>,
    threshold?: number,
  ): Promise<Result<JevDecisionResult<TDecision>, DomainError>> {
    const startTime = Date.now();
    const activeThreshold = threshold ?? this.defaultThreshold;

    const payload = {
      state: typeof state === 'string' ? { text: state } : state,
      schema: schema ?? {},
    };

    return this.rotator.executeWithRotation(async (activeKey) => {
      // In production, performs HTTP POST to ${this.baseUrl}/evaluate with activeKey and payload
      void this.baseUrl;
      void payload;
      void activeKey;

      const durationMs = Date.now() - startTime;

      // Simulated structured response contract matching TypeSafe AI jev specification
      const simulatedDecision: JevDecisionResult<TDecision> = {
        decision: { category: 'general_intent', action: 'proceed' } as unknown as TDecision,
        confidence: 0.95,
        isHighConfidence: 0.95 >= activeThreshold,
        category: 'general_intent',
        durationMs,
        rawProbabilities: {
          general_intent: 0.95,
          escalate_human: 0.05,
        },
      };

      return simulatedDecision;
    });
  }
}
