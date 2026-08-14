import { BotLifecycleStatus, type BotTransitionPolicy } from '../types/lifecycle.types.js';

export const VALID_BOT_TRANSITIONS: Record<BotLifecycleStatus, readonly BotLifecycleStatus[]> = {
  [BotLifecycleStatus.DRAFT]: [BotLifecycleStatus.CONFIGURED, BotLifecycleStatus.ARCHIVED],
  [BotLifecycleStatus.CONFIGURED]: [BotLifecycleStatus.ACTIVE, BotLifecycleStatus.ARCHIVED],
  [BotLifecycleStatus.ACTIVE]: [
    BotLifecycleStatus.PAUSED,
    BotLifecycleStatus.MAINTENANCE,
    BotLifecycleStatus.ARCHIVED,
  ],
  [BotLifecycleStatus.PAUSED]: [
    BotLifecycleStatus.ACTIVE,
    BotLifecycleStatus.MAINTENANCE,
    BotLifecycleStatus.ARCHIVED,
  ],
  [BotLifecycleStatus.MAINTENANCE]: [BotLifecycleStatus.ACTIVE, BotLifecycleStatus.ARCHIVED],
  [BotLifecycleStatus.ARCHIVED]: [],
} as const;

export const BOT_TRANSITION_POLICIES: Record<string, BotTransitionPolicy> = {
  [`${BotLifecycleStatus.DRAFT}->${BotLifecycleStatus.CONFIGURED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: false,
  },
  [`${BotLifecycleStatus.DRAFT}->${BotLifecycleStatus.ARCHIVED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.CONFIGURED}->${BotLifecycleStatus.ACTIVE}`]: {
    requiredRole: 'ADMIN',
    requiresReason: false,
  },
  [`${BotLifecycleStatus.CONFIGURED}->${BotLifecycleStatus.ARCHIVED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.ACTIVE}->${BotLifecycleStatus.PAUSED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.PAUSED}->${BotLifecycleStatus.ACTIVE}`]: {
    requiredRole: 'ADMIN',
    requiresReason: false,
  },
  [`${BotLifecycleStatus.ACTIVE}->${BotLifecycleStatus.MAINTENANCE}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.PAUSED}->${BotLifecycleStatus.MAINTENANCE}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.MAINTENANCE}->${BotLifecycleStatus.ACTIVE}`]: {
    requiredRole: 'ADMIN',
    requiresReason: false,
  },
  [`${BotLifecycleStatus.ACTIVE}->${BotLifecycleStatus.ARCHIVED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.PAUSED}->${BotLifecycleStatus.ARCHIVED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
  [`${BotLifecycleStatus.MAINTENANCE}->${BotLifecycleStatus.ARCHIVED}`]: {
    requiredRole: 'ADMIN',
    requiresReason: true,
  },
} as const;

export function canTransition(from: BotLifecycleStatus, to: BotLifecycleStatus): boolean {
  return VALID_BOT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getTransitionPolicy(
  from: BotLifecycleStatus,
  to: BotLifecycleStatus,
): BotTransitionPolicy | undefined {
  if (!canTransition(from, to)) {
    return undefined;
  }

  return BOT_TRANSITION_POLICIES[`${from}->${to}`];
}

export function requiresTransitionReason(
  from: BotLifecycleStatus,
  to: BotLifecycleStatus,
): boolean {
  return getTransitionPolicy(from, to)?.requiresReason ?? false;
}
