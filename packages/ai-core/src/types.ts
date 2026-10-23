export type AiModelTier = 'system-one' | 'fast' | 'reasoning';

export type AiProvider = 'typesafe-jev' | 'gemini' | 'deepseek';

export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCostUsd?: number;
}

export interface AiPrompt {
  readonly systemPrompt?: string;
  readonly userMessage: string;
  readonly contextData?: Readonly<Record<string, unknown>>;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface AiResponse {
  readonly text: string;
  readonly model: string;
  readonly provider: AiProvider;
  readonly tokenUsage: TokenUsage;
  readonly durationMs: number;
}

export interface JevDecisionResult<TDecision = unknown> {
  readonly decision: TDecision;
  readonly confidence: number; // 0.0 to 1.0
  readonly isHighConfidence: boolean; // >= threshold (default 0.90)
  readonly category: string;
  readonly durationMs: number;
  readonly rawProbabilities?: Readonly<Record<string, number>>;
}

export interface KeyPoolConfig {
  readonly provider: AiProvider;
  readonly keys: readonly string[];
  readonly cooldownMs?: number; // Duration to mark a key exhausted (default 60,000ms)
}
