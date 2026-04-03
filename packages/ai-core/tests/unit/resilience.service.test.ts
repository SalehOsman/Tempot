import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import { ResilienceService } from '../../src/resilience/resilience.service.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { ResilienceConfig } from '../../src/ai-core.types.js';
import type { AILogger, AIEventBus } from '../../src/ai-core.contracts.js';

/** Test config with small values for fast tests */
const testConfig: ResilienceConfig = {
  circuitBreakerThreshold: 2,
  circuitBreakerResetMs: 100,
  retryMaxAttempts: 1,
  timeoutMs: 50,
  maxConcurrent: 2,
};

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockEventBus(): AIEventBus {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
    subscribe: vi.fn(),
  };
}

describe('ResilienceService', () => {
  let service: ResilienceService;
  let logger: AILogger;
  let eventBus: AIEventBus;

  beforeEach(() => {
    logger = createMockLogger();
    eventBus = createMockEventBus();
    service = new ResilienceService(testConfig, logger, eventBus);
  });

  describe('executeGeneration', () => {
    it('returns ok(result) on success', async () => {
      const result = await service.executeGeneration(() => Promise.resolve('generated text'));

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('generated text');
    });

    it('retries on transient error and succeeds on second attempt', async () => {
      let callCount = 0;
      const fn = (): Promise<string> => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('transient failure'));
        }
        return Promise.resolve('recovered');
      };

      const result = await service.executeGeneration(fn);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('recovered');
      expect(callCount).toBe(2);
    });

    it('timeout fires and returns err(PROVIDER_TIMEOUT)', async () => {
      // Use retryMaxAttempts: 0 to avoid retry delays compounding with real timers
      const noRetryConfig: ResilienceConfig = {
        ...testConfig,
        retryMaxAttempts: 0,
      };
      const noRetryService = new ResilienceService(noRetryConfig, logger, eventBus);

      const slowFn = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve('too late'), 200));

      const result = await noRetryService.executeGeneration(slowFn);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.PROVIDER_TIMEOUT);
    });
  });

  describe('executeEmbedding', () => {
    it('returns ok(result) on success', async () => {
      const result = await service.executeEmbedding(() => Promise.resolve([0.1, 0.2, 0.3]));

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('circuit breaker', () => {
    it('opens after N consecutive failures', async () => {
      const failFn = (): Promise<never> => Promise.reject(new Error('provider down'));

      // Circuit breaker threshold=2 means 2 consecutive failures at the CB level.
      // Each executeGeneration exhausts retries (1 initial + 1 retry) and reports
      // 1 failure to the circuit breaker. So we need 2 calls to trip it.
      await service.executeGeneration(failFn);
      await service.executeGeneration(failFn);

      expect(service.isCircuitOpen()).toBe(true);
    });

    it('returns CIRCUIT_OPEN error when circuit is open', async () => {
      const failFn = (): Promise<never> => Promise.reject(new Error('provider down'));

      // Trip the breaker (2 failed calls for threshold=2)
      await service.executeGeneration(failFn);
      await service.executeGeneration(failFn);

      // Subsequent calls should fail with CIRCUIT_OPEN
      const result = await service.executeGeneration(() => Promise.resolve('should not run'));

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CIRCUIT_OPEN);
    });

    it('emits degradation event when circuit breaks', async () => {
      const failFn = (): Promise<never> => Promise.reject(new Error('provider down'));

      // Trip the breaker
      await service.executeGeneration(failFn);
      await service.executeGeneration(failFn);

      expect(eventBus.publish).toHaveBeenCalledWith(
        'system.ai.degraded',
        expect.objectContaining({
          reason: 'circuit_breaker_activated',
          failureCount: testConfig.circuitBreakerThreshold,
        }),
      );
    });

    it('isCircuitOpen() returns correct state', async () => {
      // Initially closed
      expect(service.isCircuitOpen()).toBe(false);

      // Trip the breaker
      const failFn = (): Promise<never> => Promise.reject(new Error('provider down'));
      await service.executeGeneration(failFn);
      await service.executeGeneration(failFn);

      // Now open
      expect(service.isCircuitOpen()).toBe(true);
    });
  });

  describe('bulkhead', () => {
    it('rejects excess concurrent calls with BULKHEAD_FULL', async () => {
      // Use executeEmbedding which has a 10s timeout so the slow tasks
      // don't get cancelled by the short 50ms generation timeout.
      const slowFn = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve('done'), 200));

      // Fill both bulkhead slots (maxConcurrent=2, no queue)
      const p1 = service.executeEmbedding(slowFn);
      const p2 = service.executeEmbedding(slowFn);

      // Third call should be rejected immediately by the bulkhead
      const p3 = service.executeEmbedding(() => Promise.resolve('overflow'));

      const result3 = await p3;
      expect(result3.isErr()).toBe(true);
      expect(result3._unsafeUnwrapErr().code).toBe(AI_ERRORS.BULKHEAD_FULL);

      // Clean up pending promises
      await Promise.allSettled([p1, p2]);
    });
  });

  describe('error mapping', () => {
    it('maps circuit breaker error to CIRCUIT_OPEN', async () => {
      const failFn = (): Promise<never> => Promise.reject(new Error('provider down'));

      // Trip the breaker (2 calls for threshold=2)
      await service.executeGeneration(failFn);
      await service.executeGeneration(failFn);

      // Next call should get CIRCUIT_OPEN
      const result = await service.executeGeneration(() => Promise.resolve('blocked'));

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CIRCUIT_OPEN);
    });

    it('maps timeout error to PROVIDER_TIMEOUT', async () => {
      // Use retryMaxAttempts: 0 to avoid retrying the timeout
      const noRetryConfig: ResilienceConfig = {
        ...testConfig,
        retryMaxAttempts: 0,
      };
      const noRetryService = new ResilienceService(noRetryConfig, logger, eventBus);

      const slowFn = (): Promise<string> =>
        new Promise((resolve) => setTimeout(() => resolve('late'), 200));

      const result = await noRetryService.executeGeneration(slowFn);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.PROVIDER_TIMEOUT);
    });
  });
});
