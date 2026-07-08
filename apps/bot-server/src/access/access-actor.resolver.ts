import { ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import type { AppError } from '@tempot/shared';
import type { AccessActor, AccessActorState } from './access.types.js';

export interface ResolveAccessActorInput {
  telegramId: number;
  getSessionUser: (telegramId: number) => Promise<SessionUser | null>;
  getAbilityTokens: (user: SessionUser) => readonly string[];
}

export async function resolveAccessActor(
  input: ResolveAccessActorInput,
): Promise<Result<AccessActor, AppError>> {
  try {
    const sessionUser = await input.getSessionUser(input.telegramId);
    if (sessionUser === null) return ok(unknownActor(input.telegramId, 'resolved'));
    return ok(actorFromSession(input.telegramId, sessionUser, input.getAbilityTokens));
  } catch {
    return ok(unknownActor(input.telegramId, 'failed'));
  }
}

function actorFromSession(
  telegramId: number,
  user: SessionUser,
  getAbilityTokens: ResolveAccessActorInput['getAbilityTokens'],
): AccessActor {
  const state = stateFromSessionUser(user);
  return {
    state,
    telegramId,
    profileId: String(user.id),
    abilities: state === 'PENDING' || state === 'REJECTED' ? [] : getAbilityTokens(user),
    resolutionStatus: 'resolved',
  };
}

function stateFromSessionUser(user: SessionUser): AccessActorState {
  if (user.status === 'PENDING') return 'PENDING';
  if (user.status === 'BANNED') return 'REJECTED';
  if (user.role === RoleEnum.SUPER_ADMIN) return 'SUPER_ADMIN';
  if (user.role === RoleEnum.ADMIN) return 'ADMIN';
  if (user.role === RoleEnum.USER) return 'MEMBER';
  return 'UNKNOWN';
}

function unknownActor(
  telegramId: number,
  resolutionStatus: AccessActor['resolutionStatus'],
): AccessActor {
  return {
    state: 'UNKNOWN',
    telegramId,
    abilities: [],
    resolutionStatus,
  };
}
