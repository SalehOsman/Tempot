import { describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { RoleEnum } from '@tempot/auth-core';
import { MembershipApprovalProfileService } from '../../services/membership-approval-profile.service.js';
import type { UserProfile } from '../../types/index.js';

function userProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '9500000000001',
    username: 'visitor',
    language: 'ar',
    role: RoleEnum.USER,
    createdAt: new Date('2026-06-22T00:00:00.000Z'),
    updatedAt: new Date('2026-06-22T00:00:00.000Z'),
    ...overrides,
  };
}

function repository() {
  return {
    findByTelegramId: vi.fn(),
    createMemberProfile: vi.fn(),
  };
}

function auditLogger() {
  return {
    log: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MembershipApprovalProfileService', () => {
  it('should create a default member profile when approval targets an unknown Telegram user', async () => {
    const repo = repository();
    const audit = auditLogger();
    const created = userProfile();
    repo.findByTelegramId.mockResolvedValue(err(new AppError('user-management.not_found')));
    repo.createMemberProfile.mockResolvedValue(ok(created));
    const service = new MembershipApprovalProfileService(repo, audit);

    const result = await service.ensureProfileFromApproval({
      requestId: 'request-1',
      telegramId: '9500000000001',
      telegramUsername: 'visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ user: created, created: true });
    }
    expect(repo.createMemberProfile).toHaveBeenCalledWith({
      telegramId: '9500000000001',
      username: 'visitor',
      language: 'ar',
      role: RoleEnum.USER,
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user-management.membershipApprovalProfile.activation',
        module: 'user-management',
        targetId: created.id,
        status: 'SUCCESS',
        after: expect.objectContaining({
          requestId: 'request-1',
          userId: created.id,
          created: true,
          reviewerUserId: 'admin-1',
        }),
      }),
    );
  });

  it('should return the existing profile without creating a duplicate', async () => {
    const repo = repository();
    const existing = userProfile({ id: 'existing-user' });
    repo.findByTelegramId.mockResolvedValue(ok(existing));
    const service = new MembershipApprovalProfileService(repo);

    const result = await service.ensureProfileFromApproval({
      requestId: 'request-1',
      telegramId: '9500000000001',
      telegramUsername: 'visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ user: existing, created: false });
    }
    expect(repo.createMemberProfile).not.toHaveBeenCalled();
  });
});
