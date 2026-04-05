import type { Context, NextFunction } from 'grammy';
import type { SessionUser, AbilityDefinition } from '@tempot/auth-core';
import { RoleEnum, AbilityFactory } from '@tempot/auth-core';

export interface AuthDeps {
  getSessionUser: (userId: number) => Promise<SessionUser | null>;
  abilityDefinitions: AbilityDefinition[];
  logger: { warn: (data: unknown) => void; error: (data: unknown) => void };
  t: (key: string) => string;
}

/**
 * Creates auth middleware that resolves the session user, builds
 * a CASL ability, and stores both on the context for downstream
 * middleware/handlers. Blocks requests without a `from` field.
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

    const resolved = await deps.getSessionUser(userId);
    const sessionUser: SessionUser = resolved ?? {
      id: String(userId),
      role: RoleEnum.GUEST,
    };

    (ctx as unknown as Record<string, unknown>)['sessionUser'] = sessionUser;

    try {
      const abilityResult = AbilityFactory.build(sessionUser, deps.abilityDefinitions);

      if (abilityResult.isOk()) {
        (ctx as unknown as Record<string, unknown>)['ability'] = abilityResult.value;
      } else {
        deps.logger.warn({
          module: 'bot-server',
          msg: 'ability_build_failed',
          userId,
          error: abilityResult.error.code,
        });
      }
    } catch (error: unknown) {
      deps.logger.warn({
        module: 'bot-server',
        msg: 'ability_build_failed',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await next();
  };
}
