import type { Context, NextFunction } from 'grammy';
import { limit } from '@grammyjs/ratelimiter';

const TIME_FRAME_MS = 60_000;
const MAX_REQUESTS = 30;

export interface RateLimiterDeps {
  t: (key: string) => string;
}

interface RateLimiterContext {
  from:
    | {
        id: number;
        is_bot: boolean;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      }
    | undefined;
  reply: (text: string) => Promise<unknown>;
}

interface NoRedis {
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
}

/**
 * Creates rate limiter middleware wrapping @grammyjs/ratelimiter.
 * Sends a localized message when the user exceeds the rate limit.
 */
export function createRateLimiterMiddleware(
  deps: RateLimiterDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return limit<RateLimiterContext, NoRedis>({
    timeFrame: TIME_FRAME_MS,
    limit: MAX_REQUESTS,
    onLimitExceeded: async (ctx) => {
      await ctx.reply(deps.t('bot-server.rate_limit_exceeded'));
    },
  }) as (ctx: Context, next: NextFunction) => Promise<void>;
}
