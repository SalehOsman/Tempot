import type { Context, NextFunction } from 'grammy';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import type { Redis } from 'ioredis';

export interface RateLimiterDeps {
  t: (key: string) => string;
  logger: { warn: (data: unknown) => void };
  redisClient?: Redis;
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
 */
type ScopedLimiters = Record<UpdateScope, RateLimiterMemory | RateLimiterRedis>;

function buildLimiters(redisClient: Redis | undefined): ScopedLimiters {
  const limiters = {} as ScopedLimiters;
  for (const scope of Object.keys(SCOPE_CONFIGS) as UpdateScope[]) {
    limiters[scope] = redisClient
      ? new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `rl:${scope}`,
          points: SCOPE_CONFIGS[scope].points,
          duration: SCOPE_CONFIGS[scope].duration,
        })
      : new RateLimiterMemory(SCOPE_CONFIGS[scope]);
  }
  return limiters;
}

interface RateLimitContext {
  ctx: Context;
  deps: RateLimiterDeps;
  userId: number;
  scope: UpdateScope;
  error: unknown;
  next: NextFunction;
}

async function handleRateLimitResult(rctx: RateLimitContext): Promise<void> {
  const { ctx, deps, userId, scope, error, next } = rctx;
  const isRejection = error && typeof error === 'object' && 'remainingPoints' in error;

  if (!isRejection) {
    deps.logger.warn({
      msg: 'bot-server.rate_limiter_error',
      userId,
      scope,
      error: error instanceof Error ? error.message : String(error),
    });
    await next();
    return;
  }

  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message, cause: error.cause }
      : { error };
  deps.logger.warn({
    msg: 'bot-server.rate_limited',
    userId,
    scope,
    config: SCOPE_CONFIGS[scope],
    errorDetails,
  });
  try {
    await ctx.reply(deps.t('bot-server.rate_limit_exceeded'));
  } catch (replyError: unknown) {
    deps.logger.warn({
      msg: 'bot-server.rate_limit_reply_failed',
      userId,
      error: replyError instanceof Error ? replyError.message : 'Unknown error',
    });
  }
}

/**
 * Creates rate limiter middleware with differentiated per-scope
 * limits using rate-limiter-flexible directly (D19 in spec.md).
 *
 * Active scopes:
 * - command: 10 requests per 60 seconds
 * - upload:  5 requests per 600 seconds
 * - message: 30 requests per 60 seconds
 */
export function createRateLimiterMiddleware(
  deps: RateLimiterDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  const limiters = buildLimiters(deps.redisClient);

  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) {
      await next();
      return;
    }
    const scope = classifyUpdate(ctx);
    try {
      await limiters[scope].consume(String(userId));
    } catch (error: unknown) {
      await handleRateLimitResult({ ctx, deps, userId, scope, error, next });
      return;
    }
    await next();
  };
}
