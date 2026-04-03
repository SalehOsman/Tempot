import { RateLimiterRedis } from 'rate-limiter-flexible';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { RateLimitConfig } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** User role for rate limiting */
export type RateLimitRole = 'user' | 'admin' | 'super_admin';

export class RateLimiterService {
  private readonly limiter: RateLimiterRedis;
  private readonly config: RateLimitConfig;

  constructor(redisClient: unknown, config: RateLimitConfig) {
    this.config = config;
    this.limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ai:ratelimit',
      points: config.userLimit, // Default, overridden per role in consume()
      duration: Math.floor(config.windowMs / 1000), // seconds
    });
  }

  /** Check and consume a rate limit point for a user */
  async consume(userId: string, role: RateLimitRole): AsyncResult<void, AppError> {
    const limit = this.getLimitForRole(role);

    // Super Admin = unlimited
    if (limit === 0) return ok(undefined);

    try {
      await this.limiter.consume(userId, 1, { customDuration: undefined });
      return ok(undefined);
    } catch (error: unknown) {
      return err(
        new AppError(AI_ERRORS.RATE_LIMITED, {
          userId,
          role,
          limit,
          windowMs: this.config.windowMs,
          cause: error,
        }),
      );
    }
  }

  /** Get remaining points for a user */
  async getRemaining(userId: string, role: RateLimitRole): AsyncResult<number, AppError> {
    const limit = this.getLimitForRole(role);
    if (limit === 0) return ok(Infinity);

    try {
      const res = await this.limiter.get(userId);
      if (!res) return ok(limit);
      return ok(Math.max(0, limit - res.consumedPoints));
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RATE_LIMITED, error));
    }
  }

  /** Reset rate limit for a user (Super Admin action) */
  async reset(userId: string): AsyncResult<void, AppError> {
    try {
      await this.limiter.delete(userId);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RATE_LIMITED, error));
    }
  }

  /** Get limit for a given role */
  private getLimitForRole(role: RateLimitRole): number {
    switch (role) {
      case 'super_admin':
        return this.config.superAdminLimit;
      case 'admin':
        return this.config.adminLimit;
      case 'user':
        return this.config.userLimit;
      default:
        return this.config.userLimit;
    }
  }
}
