import type { Context, NextFunction } from 'grammy';
import { createMongoAbility, type AnyAbility } from '@casl/ability';
import type { SessionUser, AbilityDefinition } from '@tempot/auth-core';
import { RoleEnum, AbilityFactory } from '@tempot/auth-core';
import { sessionContext, type ContextSession } from '@tempot/shared';

export interface AuthDeps {
  getSessionUser: (userId: number) => Promise<SessionUser | null>;
  abilityDefinitions: AbilityDefinition[];
  logger: { warn: (data: unknown) => void; error: (data: unknown) => void };
  t: (key: string) => string;
}

/**
 * Resolves the actor and builds the production CASL ability.
 * Operation-specific authorization belongs to the owning entry point.
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

    const resolved = await resolveSessionUser(userId, deps);
    if (resolved === undefined) {
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    const sessionUser: SessionUser = resolved ?? {
      id: String(userId),
      role: RoleEnum.GUEST,
      status: 'UNRESOLVED',
    };

    (ctx as unknown as Record<string, unknown>)['sessionUser'] = sessionUser;

    if (sessionUser.status === 'BANNED') {
      deps.logger.warn({
        module: 'bot-server',
        msg: 'access_denied',
        userId,
        role: sessionUser.role,
        status: sessionUser.status,
        reason: 'session_banned',
      });
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    const abilityResult =
      sessionUser.status === 'PENDING' ? createMongoAbility([]) : buildAbility(sessionUser, deps);
    if (abilityResult === null) {
      await ctx.reply(deps.t('bot-server.unauthorized'));
      return;
    }

    (ctx as unknown as Record<string, unknown>)['ability'] = abilityResult;
    await sessionContext.run(contextFromSessionUser(sessionUser), next);
  };
}

function contextFromSessionUser(user: SessionUser): ContextSession {
  return {
    userId: String(user.id),
    userRole: String(user.role),
    locale: user.language,
  };
}

async function resolveSessionUser(
  userId: number,
  deps: AuthDeps,
): Promise<SessionUser | null | undefined> {
  try {
    return await deps.getSessionUser(userId);
  } catch (error: unknown) {
    deps.logger.error({
      module: 'bot-server',
      msg: 'session_resolution_failed',
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

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
