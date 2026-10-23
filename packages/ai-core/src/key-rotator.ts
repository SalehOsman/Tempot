import { type DomainError, RateLimitedError, type Result, err, ok } from '@tembot/shared-types';
import type { KeyPoolConfig } from './types.js';

interface KeyState {
  readonly key: string;
  exhaustedUntil: number; // Timestamp until which this key is skipped
  failCount: number;
}

/**
 * Intelligent API Key Rotator & Failover Engine:
 * - Automatically balances calls across configured API keys.
 * - Detects rate-limits / quota exhaustion (HTTP 429) and immediately rotates to the next healthy key.
 * - Enforces cooldowns before retrying previously exhausted keys.
 */
export class ApiKeyRotator {
  private readonly keyStates: KeyState[];
  private currentIndex = 0;
  private readonly cooldownMs: number;

  constructor(private readonly config: KeyPoolConfig) {
    if (!config.keys || config.keys.length === 0) {
      throw new Error(
        `ApiKeyRotator for provider '${config.provider}' must have at least one key.`,
      );
    }
    this.cooldownMs = config.cooldownMs ?? 60_000; // 1 minute default cooldown
    this.keyStates = config.keys.map((key) => ({
      key,
      exhaustedUntil: 0,
      failCount: 0,
    }));
  }

  /**
   * Executes an operation using an available healthy key, rotating automatically on quota failure.
   */
  public async executeWithRotation<T>(
    operation: (activeKey: string) => Promise<T>,
  ): Promise<Result<T, DomainError>> {
    const totalKeys = this.keyStates.length;
    let attempts = 0;
    const now = Date.now();

    while (attempts < totalKeys) {
      const state = this.keyStates[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % totalKeys;

      // Skip keys currently in cooldown unless all are exhausted
      if (state.exhaustedUntil > now) {
        attempts++;
        continue;
      }

      try {
        const result = await operation(state.key);
        // Successful call resets fail count
        state.failCount = 0;
        state.exhaustedUntil = 0;
        return ok(result);
      } catch (error: unknown) {
        const isQuotaOrRateLimit = this.isRateLimitError(error);

        if (isQuotaOrRateLimit) {
          state.failCount++;
          state.exhaustedUntil = Date.now() + this.cooldownMs;
          attempts++;
          continue; // Transparently try next key in the pool!
        }

        // For non-quota errors (e.g. invalid prompt), don't exhaust the key
        const message = error instanceof Error ? error.message : 'AI execution failure';
        return err(
          new RateLimitedError(`AI call failed on provider '${this.config.provider}': ${message}`),
        );
      }
    }

    return err(
      new RateLimitedError(
        `All ${totalKeys} API keys for provider '${this.config.provider}' are exhausted or rate-limited.`,
      ),
    );
  }

  private isRateLimitError(error: unknown): boolean {
    if (!error) return false;
    const errStr = String(error).toLowerCase();
    const status =
      (error as { status?: number; statusCode?: number }).status ??
      (error as { status?: number; statusCode?: number }).statusCode;

    return (
      status === 429 ||
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('rate limit') ||
      errStr.includes('resource_exhausted')
    );
  }
}
