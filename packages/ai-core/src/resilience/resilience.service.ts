import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleAll,
  circuitBreaker,
  timeout,
  bulkhead,
  wrap,
  TimeoutStrategy,
  CircuitState,
} from 'cockatiel';
import type { CircuitBreakerPolicy } from 'cockatiel';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ResilienceConfig } from '../ai-core.types.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export class ResilienceService {
  private readonly circuitBreakerPolicy: CircuitBreakerPolicy;
  private readonly generationPolicy: ReturnType<typeof wrap>;
  private readonly embeddingPolicy: ReturnType<typeof wrap>;

  constructor(
    private readonly config: ResilienceConfig,
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {
    // Circuit breaker: consecutive failures
    this.circuitBreakerPolicy = circuitBreaker(handleAll, {
      halfOpenAfter: config.circuitBreakerResetMs,
      breaker: new ConsecutiveBreaker(config.circuitBreakerThreshold),
    });

    // Listen for circuit open
    this.circuitBreakerPolicy.onBreak(() => {
      this.logger.error({
        code: AI_ERRORS.CIRCUIT_OPEN,
        message: 'AI circuit breaker activated',
        threshold: config.circuitBreakerThreshold,
        resetMs: config.circuitBreakerResetMs,
      });
      // Fire-and-log: emit degradation event
      void this.eventBus.publish('system.ai.degraded', {
        reason: 'circuit_breaker_activated',
        failureCount: config.circuitBreakerThreshold,
        disabledUntil: new Date(Date.now() + config.circuitBreakerResetMs),
        lastError: 'consecutive_failures',
      });
    });

    // Retry policy with exponential backoff
    const retryPolicy = retry(handleAll, {
      maxAttempts: config.retryMaxAttempts,
      backoff: new ExponentialBackoff(),
    });

    // Timeout policies
    const generationTimeout = timeout(config.timeoutMs, TimeoutStrategy.Aggressive);
    const embeddingTimeout = timeout(10_000, TimeoutStrategy.Aggressive);

    // Bulkhead: limit concurrent AI calls
    const bulkheadPolicy = bulkhead(config.maxConcurrent);

    // Compose policies: bulkhead → circuit breaker → retry → timeout
    this.generationPolicy = wrap(
      bulkheadPolicy,
      this.circuitBreakerPolicy,
      retryPolicy,
      generationTimeout,
    );
    this.embeddingPolicy = wrap(
      bulkheadPolicy,
      this.circuitBreakerPolicy,
      retryPolicy,
      embeddingTimeout,
    );
  }

  /** Execute an AI generation call with full resilience */
  async executeGeneration<T>(fn: () => Promise<T>): AsyncResult<T, AppError> {
    try {
      const result = await this.generationPolicy.execute(fn);
      return ok(result as T);
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  /** Execute an embedding call with resilience */
  async executeEmbedding<T>(fn: () => Promise<T>): AsyncResult<T, AppError> {
    try {
      const result = await this.embeddingPolicy.execute(fn);
      return ok(result as T);
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  /** Check if circuit is currently open */
  isCircuitOpen(): boolean {
    return this.circuitBreakerPolicy.state === CircuitState.Open;
  }

  /** Map cockatiel errors to AppError using boolean flags on error instances */
  private mapError<T>(error: unknown): ReturnType<() => AsyncResult<T, AppError>> {
    if (this.hasFlag(error, 'isBrokenCircuitError')) {
      return Promise.resolve(err(new AppError(AI_ERRORS.CIRCUIT_OPEN, error)));
    }
    if (this.hasFlag(error, 'isTaskCancelledError')) {
      return Promise.resolve(err(new AppError(AI_ERRORS.PROVIDER_TIMEOUT, error)));
    }
    if (this.hasFlag(error, 'isBulkheadRejectedError')) {
      return Promise.resolve(err(new AppError(AI_ERRORS.BULKHEAD_FULL, error)));
    }
    return Promise.resolve(err(new AppError(AI_ERRORS.PROVIDER_UNAVAILABLE, error)));
  }

  /** Check if an error has a cockatiel type flag (avoids buggy type guard functions) */
  private hasFlag(error: unknown, flag: string): boolean {
    return error instanceof Error && flag in error;
  }
}
