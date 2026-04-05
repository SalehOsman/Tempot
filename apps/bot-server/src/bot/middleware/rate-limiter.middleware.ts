import type { Context, NextFunction } from 'grammy';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface RateLimiterDeps {
  t: (key: string) => string;
  logger: { warn: (data: unknown) => void };
}

type UpdateScope = 'command' | 'upload' | 'message';

interface ScopeConfig {
  points: number;
  duration: number;
}

const SCOPE_CONFIGS: Record<UpdateScope, ScopeConfig> = {
  command: { points: 10, duration: 60 },
  upload: { points: 5, duration: 600 },
  message: { points: 30, duration: 60 },
};

// TODO: ai_request scope (20/hour, { points: 20, duration: 3600 }) — consumed by ai-core module when available

// TODO: denied_access scope (5/10min, { points: 5, duration: 600 } → temporary ban + alert) — consumed by auth middleware

// TODO: global scope — single RateLimiterMemory shared across all users,
//       enforced before per-user checks. Requires spec decision on global limits.

// TODO: per_group scope — keyed by group chat ID instead of user ID,
//       applied to group contexts. Requires UpdateScope extension + classifyUpdate changes.

function classifyUpdate(ctx: Context): UpdateScope {
  const msg = ctx.message;
  if (msg?.text?.startsWith('/')) return 'command';
  if (msg?.document || msg?.photo || msg?.video) return 'upload';
  return 'message';
}

/**
 * Creates rate limiter middleware with differentiated per-scope
 * limits using rate-limiter-flexible directly (D19 in spec.md).
 *
 * - command: 10 requests per 60 seconds
 * - upload:  5 requests per 600 seconds
 * - message: 30 requests per 60 seconds
 * - ai_request: 20 per hour (TODO — consumed by ai-core)
 * - denied_access: 5 per 10 minutes (TODO — consumed by auth middleware)
 */
export function createRateLimiterMiddleware(
  deps: RateLimiterDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  const { logger } = deps;
  const limiters: Record<UpdateScope, RateLimiterMemory> = {
    command: new RateLimiterMemory(SCOPE_CONFIGS.command),
    upload: new RateLimiterMemory(SCOPE_CONFIGS.upload),
    message: new RateLimiterMemory(SCOPE_CONFIGS.message),
  };

  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) {
      await next();
      return;
    }

    const scope = classifyUpdate(ctx);
    const limiter = limiters[scope];

    try {
      await limiter.consume(String(userId));
      await next();
    } catch {
      logger.warn({ msg: 'bot-server.rate_limited', userId, scope });
      try {
        await ctx.reply(deps.t('bot-server.rate_limit_exceeded'));
      } catch (replyError: unknown) {
        logger.warn({
          msg: 'bot-server.rate_limit_reply_failed',
          userId,
          error: replyError instanceof Error ? replyError.message : 'Unknown error',
        });
      }
    }
  };
}
