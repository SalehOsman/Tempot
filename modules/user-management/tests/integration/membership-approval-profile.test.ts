import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../../repositories/user.repository.js';
import { MembershipApprovalProfileService } from '../../services/membership-approval-profile.service.js';

describe('membership approval profile activation', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  let service: MembershipApprovalProfileService;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    service = new MembershipApprovalProfileService(new UserRepository(auditLogger, testDb.prisma));
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should create an active USER profile from an approved membership request payload', async () => {
    const result = await service.ensureProfileFromApproval({
      requestId: 'request-1',
      telegramId: '9500000000101',
      telegramUsername: 'approved_visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.created).toBe(true);
    expect(result.value.user).toMatchObject({
      telegramId: 9500000000101n,
      username: 'approved_visitor',
      language: 'ar',
      role: RoleEnum.USER,
    });

    const persisted = await testDb.prisma.userProfile.findUnique({
      where: { telegramId: 9500000000101n },
    });
    expect(persisted).toMatchObject({
      username: 'approved_visitor',
      language: 'ar',
      role: RoleEnum.USER,
    });
  });

  it('should be idempotent when the profile already exists', async () => {
    await testDb.prisma.userProfile.create({
      data: {
        telegramId: 9500000000102n,
        username: 'existing_visitor',
        language: 'ar',
        role: RoleEnum.USER,
      },
    });

    const result = await service.ensureProfileFromApproval({
      requestId: 'request-2',
      telegramId: '9500000000102',
      telegramUsername: 'existing_visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.created).toBe(false);
      expect(result.value.user.telegramId).toBe(9500000000102n);
    }

    const profiles = await testDb.prisma.userProfile.findMany({
      where: { telegramId: 9500000000102n },
    });
    expect(profiles).toHaveLength(1);
  });
});
