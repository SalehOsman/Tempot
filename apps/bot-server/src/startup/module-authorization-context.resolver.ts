import { AbilityFactory, RoleEnum, type SessionUser } from '@tempot/auth-core';
import type { SessionProvider } from '@tempot/session-manager';
import type { AbilityRegistry } from '../authorization/ability-registry.js';
import type { AuthorizationContextResolver } from '../bot-server.types.js';
import type { AssembleDepsOptions } from './deps.orchestrator.js';

export function buildAuthorizationContextResolver(
  opts: AssembleDepsOptions,
  abilityRegistry: AbilityRegistry,
): AuthorizationContextResolver {
  return async (ctx) => {
    const telegramId = ctx.from?.id;
    if (telegramId === undefined) return null;
    const chatId = ctx.chat?.id ?? telegramId;
    const result = await opts.sessionProvider.getSession(String(telegramId), String(chatId));
    const actor = resolveCurrentActor(result, telegramId);
    const ability = AbilityFactory.build(actor, abilityRegistry.getRuntimeDefinitions());
    if (ability.isErr()) throw ability.error;
    return { actor, ability: ability.value };
  };
}

function resolveCurrentActor(
  result: Awaited<ReturnType<SessionProvider['getSession']>>,
  telegramId: number,
): SessionUser {
  if (result.isErr()) {
    if (result.error.code !== 'session-manager.not_found') throw result.error;
    return { id: String(telegramId), role: RoleEnum.GUEST, status: 'UNRESOLVED' };
  }
  return {
    id: result.value.userId,
    role: result.value.role,
    status: result.value.status,
    language: result.value.language,
  };
}
