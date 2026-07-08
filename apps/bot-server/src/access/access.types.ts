import type { BotAccessMode } from '@tempot/settings';

export type AccessActorState =
  | 'UNKNOWN'
  | 'PENDING'
  | 'REJECTED'
  | 'MEMBER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type AccessActorResolutionStatus = 'resolved' | 'failed';

export type AccessCapabilityClassification =
  | 'bootstrap'
  | 'public'
  | 'member'
  | 'protected'
  | 'admin';

export type AccessDecisionReason =
  | 'allowed'
  | 'bootstrap_allowed'
  | 'public_allowed'
  | 'profile_not_found'
  | 'membership_pending'
  | 'membership_rejected'
  | 'capability_not_public'
  | 'missing_ability'
  | 'actor_resolution_failed';

export interface AccessActor {
  state: AccessActorState;
  abilities: readonly string[];
  resolutionStatus: AccessActorResolutionStatus;
  telegramId?: number;
  profileId?: string;
  membershipRequestId?: string;
  role?: string;
}

export interface AccessCapability {
  id: string;
  classification: AccessCapabilityClassification;
  requiredAbility?: string;
}

export interface AccessDecisionInput {
  accessMode: BotAccessMode;
  actor: AccessActor;
  capability: AccessCapability;
}

export interface AccessDecision {
  allowed: boolean;
  reason: AccessDecisionReason;
  actorState: AccessActorState;
  accessMode: BotAccessMode;
  capabilityId: string;
  classification: AccessCapabilityClassification;
  auditRequired: boolean;
}
