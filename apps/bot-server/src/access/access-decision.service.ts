import { ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AppError } from '@tempot/shared';
import type { AccessDecision, AccessDecisionInput, AccessDecisionReason } from './access.types.js';

export function decideAccess(input: AccessDecisionInput): Result<AccessDecision, AppError> {
  const reason = resolveReason(input);

  return ok({
    allowed: isAllowedReason(reason),
    reason,
    actorState: input.actor.state,
    accessMode: input.accessMode,
    capabilityId: input.capability.id,
    classification: input.capability.classification,
    auditRequired:
      reason !== 'allowed' && reason !== 'bootstrap_allowed' && reason !== 'public_allowed',
  });
}

function resolveReason(input: AccessDecisionInput): AccessDecisionReason {
  if (input.actor.resolutionStatus === 'failed') return 'actor_resolution_failed';
  if (input.capability.classification === 'bootstrap') return 'bootstrap_allowed';
  if (input.actor.state === 'PENDING') return 'membership_pending';
  if (input.actor.state === 'REJECTED') return 'membership_rejected';
  if (input.actor.state === 'UNKNOWN') return resolveUnknownActorReason(input);
  return resolveKnownActorReason(input);
}

function resolveUnknownActorReason(input: AccessDecisionInput): AccessDecisionReason {
  if (input.accessMode === 'public' && input.capability.classification === 'public') {
    return 'public_allowed';
  }
  if (input.capability.classification === 'public') return 'capability_not_public';
  return 'profile_not_found';
}

function resolveKnownActorReason(input: AccessDecisionInput): AccessDecisionReason {
  const requiredAbility = input.capability.requiredAbility;
  if (requiredAbility === undefined) return 'allowed';
  return hasRequiredAbility(input.actor.abilities, requiredAbility) ? 'allowed' : 'missing_ability';
}

function isAllowedReason(reason: AccessDecisionReason): boolean {
  return reason === 'allowed' || reason === 'bootstrap_allowed' || reason === 'public_allowed';
}

function hasRequiredAbility(abilities: readonly string[], requiredAbility: string): boolean {
  return abilities.includes(requiredAbility) || abilities.includes('manage.all');
}
