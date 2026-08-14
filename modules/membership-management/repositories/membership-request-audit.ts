import type { IAuditLogger } from '@tempot/database';
import type { MembershipRequest } from '../types/membership-request.types.js';

interface RepositoryAuditContext {
  userId: string | null;
  userRole: string | null;
}

interface TransitionAuditInput {
  auditLogger: IAuditLogger;
  context: RepositoryAuditContext;
  before: MembershipRequest;
  after: MembershipRequest;
}

export async function logTransitionAudit(input: TransitionAuditInput): Promise<void> {
  const { after, auditLogger, before, context } = input;
  await auditLogger.log({
    userId: context.userId,
    userRole: context.userRole,
    action: 'membership-management.membershipRequest.transition',
    module: 'membership-management',
    targetId: after.id,
    targetTelegramId: after.telegramId,
    before: {
      status: before.status,
      reviewerUserId: before.reviewerUserId,
    },
    after: {
      status: after.status,
      reviewerUserId: after.reviewerUserId,
      reviewedAt: after.reviewedAt?.toISOString() ?? null,
      createdUserProfileId: after.createdUserProfileId,
    },
    status: 'SUCCESS',
  });
}
