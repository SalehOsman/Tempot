import type { Context, NextFunction } from 'grammy';
import type { AnyAbility, RawRuleOf } from '@casl/ability';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import type { BotAccessMode } from '@tempot/settings';
import { capabilityFromContext } from '../../access/access-capability.resolver.js';
import { decideAccess } from '../../access/access-decision.service.js';
import type {
  AccessActor,
  AccessActorState,
  AccessCapability,
  AccessDecision,
} from '../../access/access.types.js';
import type { AuditEntry } from './audit.middleware.js';

export interface AccessGateDeps {
  auditLog: (entry: AuditEntry) => Promise<void>;
  getAccessMode: () => BotAccessMode | Promise<BotAccessMode>;
  t: (key: string) => string;
  logger: { warn: (data: Record<string, unknown>) => void };
}

interface AccessContextState {
  sessionUser?: SessionUser;
  ability?: AnyAbility;
}

export function createAccessGateMiddleware(
  deps: AccessGateDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const capability = capabilityFromContext(ctx);
    if (capability === null) {
      await next();
      return;
    }

    const actor = actorFromContext(ctx);
    const accessMode = await deps.getAccessMode();
    const decision = decideAccess({ accessMode, actor, capability });
    if (decision.isErr() || !decision.value.allowed) {
      const reason = decision.isOk() ? decision.value.reason : 'decision_error';
      logDenied({
        deps,
        actor,
        capability,
        reason,
      });
      if (decision.isOk() && decision.value.auditRequired) {
        await auditDenied({ deps, actor, capability, decision: decision.value });
      }
      await ctx.reply(deps.t('bot-server.access_denied'));
      return;
    }

    await next();
  };
}

function actorFromContext(ctx: Context): AccessActor {
  const sessionUser = (ctx as Context & AccessContextState).sessionUser;
  if (sessionUser === undefined) return unknownActor('failed');
  const state = stateFromSessionUser(sessionUser);
  return {
    state,
    telegramId: ctx.from?.id,
    profileId: String(sessionUser.id),
    role: sessionUser.role,
    abilities:
      state === 'PENDING' || state === 'REJECTED'
        ? []
        : abilityTokensFromContext(ctx as Context & AccessContextState),
    resolutionStatus: 'resolved',
  };
}

function stateFromSessionUser(user: SessionUser): AccessActorState {
  if (user.status === 'PENDING') return 'PENDING';
  if (user.status === 'BANNED') return 'REJECTED';
  if (user.status === 'UNRESOLVED') return 'UNKNOWN';
  if (user.role === RoleEnum.SUPER_ADMIN) return 'SUPER_ADMIN';
  if (user.role === RoleEnum.ADMIN) return 'ADMIN';
  if (user.role === RoleEnum.USER) return 'MEMBER';
  return 'UNKNOWN';
}

function abilityTokensFromContext(ctx: Context & AccessContextState): readonly string[] {
  const ability = ctx.ability;
  if (ability !== undefined) return abilityTokensFromAbility(ability);
  return abilityTokensFromSession(ctx.sessionUser);
}

function abilityTokensFromAbility(ability: AnyAbility): readonly string[] {
  return ability.rules.flatMap((rule: RawRuleOf<AnyAbility>) => {
    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject ?? 'all'];
    return actions.flatMap((action) =>
      subjects.map((subject) => `${String(action)}.${String(subject)}`),
    );
  });
}

function abilityTokensFromSession(user: SessionUser | undefined): readonly string[] {
  if (user === undefined) return [];
  const tokens = user['accessAbilityTokens'];
  if (!Array.isArray(tokens)) return [];
  return tokens.filter((token): token is string => typeof token === 'string');
}

function unknownActor(resolutionStatus: AccessActor['resolutionStatus']): AccessActor {
  return {
    state: 'UNKNOWN',
    abilities: [],
    resolutionStatus,
  };
}

interface DeniedLogInput {
  deps: AccessGateDeps;
  actor: AccessActor;
  capability: AccessCapability;
  reason: string;
}

interface DeniedAuditInput {
  deps: AccessGateDeps;
  actor: AccessActor;
  capability: AccessCapability;
  decision: AccessDecision;
}

function logDenied(input: DeniedLogInput): void {
  const { deps, actor, capability, reason } = input;
  deps.logger.warn({
    module: 'bot-server',
    msg: 'access_gate_denied',
    actorState: actor.state,
    capabilityId: capability.id,
    reason,
  });
}

async function auditDenied(input: DeniedAuditInput): Promise<void> {
  const { deps, actor, capability, decision } = input;
  try {
    await deps.auditLog({
      action: 'access.denied',
      module: 'bot-server',
      targetId: capability.id,
      status: 'DENIED',
      userId: actor.telegramId?.toString() ?? actor.profileId,
      userRole: actor.role ?? actor.state,
      after: {
        accessMode: decision.accessMode,
        actorState: decision.actorState,
        capabilityId: decision.capabilityId,
        classification: decision.classification,
        reason: decision.reason,
      },
    });
  } catch (error: unknown) {
    deps.logger.warn({
      code: 'bot-server.access_denial_audit_failed',
      capabilityId: capability.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
