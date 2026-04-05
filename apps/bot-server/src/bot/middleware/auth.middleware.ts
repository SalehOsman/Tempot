import type { Context, NextFunction } from 'grammy';
import type { AnyAbility } from '@casl/ability';
import type { SessionUser, AbilityDefinition } from '@tempot/auth-core';
import { RoleEnum, AbilityFactory, Guard } from '@tempot/auth-core';

export interface AuthDeps {
  getSessionUser: (userId: number) => Promise<SessionUser | null>;
  abilityDefinitions: AbilityDefinition[];
  logger: { warn: (data: unknown) => void; error: (data: unknown) => void };
  t: (key: string) => string;
}

/**
 * Creates auth middleware that resolves the session user, builds
 * a CASL ability, enforces authorization via Guard.enforce, and
 * stores both on the context for downstream middleware/handlers.
 * Blocks requests without a `from` field, when ability build fails,
 * or when Guard.enforce('manage', 'all') denies access (W1/W2/W3).
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

    const abilityResult = buildAbility(sessionUser, deps);
    if (abilityResult === null) {
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    // W1: Enforce authorization — blocks GUEST users (W3) and
    // any user whose ability lacks 'manage all'
    const enforceResult = Guard.enforce(abilityResult, 'manage', 'all');
    if (enforceResult.isErr()) {
      deps.logger.warn({
        module: 'bot-server',
        msg: 'access_denied',
        userId,
        role: sessionUser.role,
      });
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    (ctx as unknown as Record<string, unknown>)['ability'] = abilityResult;
    await next();
  };
}

/** W2: Build ability and return it, or null on failure */
function buildAbility(user: SessionUser, deps: AuthDeps): AnyAbility | null {
  try {
    const result = AbilityFactory.build(user, deps.abilityDefinitions);

    if (result.isOk()) {
      return result.value;
    }

    deps.logger.warn({
      module: 'bot-server',
      msg: 'ability_build_failed',
      userId: user.id,
      error: result.error.code,
    });
    return null;
  } catch (error: unknown) {
    deps.logger.warn({
      module: 'bot-server',
      msg: 'ability_build_failed',
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
