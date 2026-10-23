import { DomainError } from '@tembot/shared-types';
import type { Result } from 'neverthrow';
import type {
  AiPrompt,
  AiResponse,
  JevDecisionResult,
} from '@tembot/ai-core';

export class AiGatewayError extends DomainError {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    httpStatus = 500,
    details?: unknown
  ) {
    super(message, details);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface AiGenerationRequest {
  readonly tenantId: string;
  readonly actorId: string;
  readonly prompt: AiPrompt;
  readonly preferredTier?: 'fast' | 'reasoning';
}

export interface AiGatewayPort {
  /**
   * System One: Fast deterministic decision scoring via TypeSafe AI jev.
   */
  evaluateDecision<TDecision>(
    state: Record<string, unknown> | string,
    options?: {
      readonly confidenceThreshold?: number;
      readonly tenantId?: string;
      readonly actorId?: string;
    }
  ): Promise<Result<JevDecisionResult<TDecision>, AiGatewayError>>;

  /**
   * System Two: Generative synthesis with automatic multi-key rotation and failover.
   */
  generateResponse(
    request: AiGenerationRequest
  ): Promise<Result<AiResponse, AiGatewayError>>;
}
