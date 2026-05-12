import { TemplateStatus } from '../types/template.types.js';
import type { Template } from '../types/template.types.js';

export const VALID_TRANSITIONS: Record<TemplateStatus, readonly TemplateStatus[]> = {
  [TemplateStatus.DRAFT]: [TemplateStatus.REVIEW],
  [TemplateStatus.REVIEW]: [TemplateStatus.PUBLISHED, TemplateStatus.DRAFT],
  [TemplateStatus.PUBLISHED]: [TemplateStatus.ARCHIVED],
  [TemplateStatus.ARCHIVED]: [TemplateStatus.DRAFT],
} as const;

export function canTransition(from: TemplateStatus, to: TemplateStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface TransitionGuardResult {
  allowed: boolean;
  reason?: string;
}

export function checkCompletenessForReview(template: Template): TransitionGuardResult {
  if (!template.name || template.name.trim().length === 0) {
    return { allowed: false, reason: 'template.error.missing_name' };
  }
  if (!template.description || template.description.trim().length === 0) {
    return { allowed: false, reason: 'template.error.missing_description' };
  }
  if (!template.categoryId) {
    return { allowed: false, reason: 'template.error.missing_category' };
  }
  if (!template.content.commands || template.content.commands.length === 0) {
    return { allowed: false, reason: 'template.error.missing_commands' };
  }
  return { allowed: true };
}

export type RequiredRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface TransitionPolicy {
  requiredRole: RequiredRole;
  ownerOnly: boolean;
  requiresReason: boolean;
}

export const TRANSITION_POLICIES: Record<string, TransitionPolicy> = {
  [`${TemplateStatus.DRAFT}->${TemplateStatus.REVIEW}`]: {
    requiredRole: 'USER',
    ownerOnly: true,
    requiresReason: false,
  },
  [`${TemplateStatus.REVIEW}->${TemplateStatus.PUBLISHED}`]: {
    requiredRole: 'ADMIN',
    ownerOnly: false,
    requiresReason: false,
  },
  [`${TemplateStatus.REVIEW}->${TemplateStatus.DRAFT}`]: {
    requiredRole: 'ADMIN',
    ownerOnly: false,
    requiresReason: true,
  },
  [`${TemplateStatus.PUBLISHED}->${TemplateStatus.ARCHIVED}`]: {
    requiredRole: 'USER',
    ownerOnly: true,
    requiresReason: true,
  },
  [`${TemplateStatus.ARCHIVED}->${TemplateStatus.DRAFT}`]: {
    requiredRole: 'USER',
    ownerOnly: true,
    requiresReason: false,
  },
};

export function getTransitionPolicy(
  from: TemplateStatus,
  to: TemplateStatus,
): TransitionPolicy | undefined {
  return TRANSITION_POLICIES[`${from}->${to}`];
}
