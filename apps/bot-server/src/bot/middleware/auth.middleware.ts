import type { Context, NextFunction } from 'grammy';

export interface SessionUser {
  id: string;
  role: string;
}

export interface AuthDeps {
  getSessionUser: (userId: number) => Promise<SessionUser | null>;
  t: (key: string) => string;
}

/**
 * Creates auth middleware that resolves the session user and stores it
 * on the context for downstream middleware/handlers.
 * Blocks requests without a `from` field (anonymous updates).
 */
export function createAuthMiddleware(
  deps: AuthDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    const user = await deps.getSessionUser(userId);

    if (user) {
      (ctx as unknown as Record<string, unknown>)['sessionUser'] = user;
    }

    await next();
  };
}
