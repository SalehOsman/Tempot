import type { AnyAbility } from '@casl/ability';
import type { Context, MiddlewareFn, NextFunction } from 'grammy';
import type { SessionUser } from '@tempot/auth-core';
import type {
  AuthorizationPolicy,
  AuthorizationContextResolver,
  ModuleAuthorizationProvider,
  ModuleLogger,
} from '../bot-server.types.js';

interface AuthorizationDeps {
  logger: Pick<ModuleLogger, 'warn'>;
  t: (key: string) => string;
  resolveContext?: AuthorizationContextResolver;
}

interface AuthorizationContext {
  ability?: AnyAbility;
  sessionUser?: SessionUser;
}

interface DenialInput {
  ctx: Context;
  policy: AuthorizationPolicy;
  actor: SessionUser | undefined;
  reason: string;
  deps: AuthorizationDeps;
}

export function createModuleAuthorizationProvider(
  deps: AuthorizationDeps,
): ModuleAuthorizationProvider {
  const enforce = async (ctx: Context, policy: AuthorizationPolicy): Promise<boolean> => {
    const authorizationContext = ctx as Context & AuthorizationContext;
    const actor = authorizationContext.sessionUser;
    const ability = authorizationContext.ability;
    const reason = resolveDenialReason(actor, ability, policy);

    if (reason === null) return true;
    return deny({ ctx, policy, actor, reason, deps });
  };

  const refreshAndEnforce = async (ctx: Context, policy: AuthorizationPolicy): Promise<boolean> => {
    const current = ctx as Context & AuthorizationContext;
    try {
      const resolved = await deps.resolveContext?.(ctx);
      if (!resolved) {
        return deny({
          ctx,
          policy,
          actor: current.sessionUser,
          reason: 'authorization_refresh_unavailable',
          deps,
        });
      }
      current.sessionUser = resolved.actor;
      current.ability = resolved.ability;
      return enforce(ctx, policy);
    } catch {
      return deny({
        ctx,
        policy,
        actor: current.sessionUser,
        reason: 'authorization_refresh_failed',
        deps,
      });
    }
  };

  const guard = (policy: AuthorizationPolicy): MiddlewareFn<Context> => {
    return async (ctx: Context, next: NextFunction): Promise<void> => {
      if (await enforce(ctx, policy)) {
        await next();
      }
    };
  };

  return { enforce, guard, refreshAndEnforce };
}

async function deny(input: DenialInput): Promise<false> {
  const { ctx, policy, actor, reason, deps } = input;
  deps.logger.warn({
    module: policy.module,
    msg: 'authorization_denied',
    actorId: actor ? String(actor.id) : 'unresolved',
    role: actor?.role ?? 'unresolved',
    action: policy.action,
    subject: policy.subject,
    outcome: 'denied',
    reason,
  });
  await sendDenial(ctx, deps.t('bot-server.unauthorized'));
  return false;
}

function resolveDenialReason(
  actor: SessionUser | undefined,
  ability: AnyAbility | undefined,
  policy: AuthorizationPolicy,
): string | null {
  if (!actor || !ability) return 'missing_authorization_context';
  if (actor.status === 'BANNED' || actor.status === 'PENDING') {
    return `session_${actor.status.toLowerCase()}`;
  }
  if (
    actor.status === 'UNRESOLVED' &&
    policy.classification !== 'public' &&
    policy.classification !== 'bootstrap'
  ) {
    return 'unresolved_actor';
  }
  return ability.can(policy.action, policy.subject) ? null : 'ability_forbidden';
}

async function sendDenial(ctx: Context, message: string): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery(message);
    return;
  }
  await ctx.reply(message);
}
