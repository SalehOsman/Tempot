import { RoleEnum } from '@tempot/auth-core';
import { AppError, err, ok, type AsyncResult } from '@tempot/shared';
import type { UserProfile } from '../types/index.js';

export interface MembershipApprovalProfileInput {
  requestId: string;
  telegramId: string;
  telegramUsername?: string | null;
  telegramLanguageCode?: string | null;
  reviewerUserId: string;
}

export interface MembershipApprovalProfileResult {
  user: UserProfile;
  created: boolean;
}

export interface MembershipApprovalProfileRepository {
  findByTelegramId(telegramId: string): AsyncResult<UserProfile, AppError>;
  createMemberProfile(input: {
    telegramId: string;
    username?: string;
    language: string;
    role: RoleEnum.USER;
  }): AsyncResult<UserProfile, AppError>;
}

export interface MembershipApprovalProfileAuditLogger {
  log(data: Record<string, unknown>): Promise<void>;
}

export class MembershipApprovalProfileService {
  constructor(
    private readonly repository: MembershipApprovalProfileRepository,
    private readonly auditLogger?: MembershipApprovalProfileAuditLogger,
  ) {}

  async ensureProfileFromApproval(
    input: MembershipApprovalProfileInput,
  ): AsyncResult<MembershipApprovalProfileResult, AppError> {
    const existing = await this.repository.findByTelegramId(input.telegramId);
    if (existing.isOk()) {
      const result = { user: existing.value, created: false };
      const audited = await this.auditActivation(input, result);
      if (audited.isErr()) return err(audited.error);

      return ok(result);
    }
    if (existing.error.code !== 'user-management.not_found') return err(existing.error);

    const created = await this.repository.createMemberProfile({
      telegramId: input.telegramId,
      username: input.telegramUsername ?? undefined,
      language: input.telegramLanguageCode ?? 'ar',
      role: RoleEnum.USER,
    });
    if (created.isErr()) return err(created.error);

    const result = { user: created.value, created: true };
    const audited = await this.auditActivation(input, result);
    if (audited.isErr()) return err(audited.error);

    return ok(result);
  }

  private async auditActivation(
    input: MembershipApprovalProfileInput,
    result: MembershipApprovalProfileResult,
  ): AsyncResult<void, AppError> {
    if (this.auditLogger === undefined) return ok(undefined);

    try {
      await this.auditLogger.log({
        action: 'user-management.membershipApprovalProfile.activation',
        module: 'user-management',
        targetId: result.user.id,
        status: 'SUCCESS',
        after: {
          requestId: input.requestId,
          telegramId: input.telegramId,
          userId: result.user.id,
          created: result.created,
          reviewerUserId: input.reviewerUserId,
        },
      });
      return ok(undefined);
    } catch (error) {
      return err(new AppError('user-management.membership_approval_audit_failed', error));
    }
  }
}
