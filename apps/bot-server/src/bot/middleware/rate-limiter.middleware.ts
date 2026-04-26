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
 * Active scopes:
 * - command: 10 requests per 60 seconds
 * - upload:  5 requests per 600 seconds
 * - message: 30 requests per 60 seconds
 *
 * Planned scopes (see specs/020-bot-server/research.md):
 * - ai_request: 20 per hour — consumed by ai-core module
 * - denied_access: 5 per 10 min → temporary ban + alert — consumed by auth middleware
 * - global: single limiter shared across all users
 * - per_group: keyed by group chat ID instead of user ID
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        cause: error.cause,
      } : { error };
      logger.warn({
        msg: 'bot-server.rate_limited',
        userId,
        scope,
        config: SCOPE_CONFIGS[scope],
        errorDetails,
      });
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
