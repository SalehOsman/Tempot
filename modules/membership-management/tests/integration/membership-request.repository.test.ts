import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { Prisma } from '@tempot/database';
import { PrismaMembershipRequestRepository } from '../../repositories/membership-request.repository.js';
import { up } from '../../database/migrations/20260622000000_create_membership_requests.js';

describe('PrismaMembershipRequestRepository', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  let repository: PrismaMembershipRequestRepository;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    await up(testDb.prisma as unknown as Prisma.TransactionClient);
    repository = new PrismaMembershipRequestRepository(auditLogger, testDb.prisma);
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should persist pending requests and find them by Telegram id', async () => {
    const created = await repository.createRequest({
      telegramId: '9500000000001',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
      telegramLanguageCode: 'ar',
    });

    expect(created.isOk()).toBe(true);
    if (created.isErr()) return;

    const active = await repository.findActiveByTelegramId('9500000000001');

    expect(active.isOk()).toBe(true);
    if (active.isOk()) {
      expect(active.value).toMatchObject({
        id: created.value.id,
        telegramId: '9500000000001',
        telegramUsername: 'visitor',
        telegramFirstName: 'Visitor',
        telegramLanguageCode: 'ar',
        status: 'PENDING',
      });
    }
  });

  it('should remove approved requests from the active pending lookup', async () => {
    const created = await repository.createRequest({
      telegramId: '9500000000002',
      telegramUsername: 'approved-visitor',
    });
    expect(created.isOk()).toBe(true);
    if (created.isErr()) return;

    const approved = await repository.markApproved({
      requestId: created.value.id,
      reviewerUserId: 'admin-1',
    });
    expect(approved.isOk()).toBe(true);
    if (approved.isOk()) {
      expect(approved.value.status).toBe('APPROVED');
      expect(approved.value.reviewerUserId).toBe('admin-1');
      expect(approved.value.reviewedAt).toBeInstanceOf(Date);
    }
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'membership-management.membershipRequest.transition',
        module: 'membership-management',
        targetId: created.value.id,
        status: 'SUCCESS',
        before: expect.objectContaining({ status: 'PENDING' }),
        after: expect.objectContaining({
          status: 'APPROVED',
          reviewerUserId: 'admin-1',
        }),
      }),
    );

    const active = await repository.findActiveByTelegramId('9500000000002');
    expect(active.isOk()).toBe(true);
    if (active.isOk()) {
      expect(active.value).toBeNull();
    }
  });

  it('should update pending request details for repeated membership submission', async () => {
    const created = await repository.createRequest({
      telegramId: '9500000000004',
      telegramUsername: 'repeat-visitor',
    });
    expect(created.isOk()).toBe(true);
    if (created.isErr()) return;

    const updated = await repository.updatePendingDetails(created.value.id, {
      telegramId: '9500000000004',
      fullName: 'Repeat Visitor',
      nickname: 'Repeat',
      mobileNumber: '01012345678',
      requestMessage: 'Need access',
    });

    expect(updated.isOk()).toBe(true);
    if (updated.isOk()) {
      expect(updated.value).toMatchObject({
        id: created.value.id,
        fullName: 'Repeat Visitor',
        nickname: 'Repeat',
        mobileNumber: '01012345678',
        requestMessage: 'Need access',
      });
    }
  });

  it('should allow exactly one terminal decision during concurrent review', async () => {
    const created = await repository.createRequest({
      telegramId: '9500000000003',
      telegramUsername: 'race-visitor',
    });
    expect(created.isOk()).toBe(true);
    if (created.isErr()) return;

    const decisions = await Promise.all([
      repository.markApproved({
        requestId: created.value.id,
        reviewerUserId: 'admin-1',
      }),
      repository.markRejected({
        requestId: created.value.id,
        reviewerUserId: 'admin-2',
        rejectionReason: 'membership-management.rejection.admin_rejected',
      }),
    ]);

    const successfulDecisions = decisions.filter((decision) => decision.isOk());
    const rejectedDecisions = decisions.filter((decision) => decision.isErr());

    expect(successfulDecisions).toHaveLength(1);
    expect(rejectedDecisions).toHaveLength(1);
    if (rejectedDecisions[0]?.isErr()) {
      expect(rejectedDecisions[0].error.code).toBe(
        'membership-management.request_already_terminal',
      );
    }

    const stored = await repository.findRequestById(created.value.id);
    expect(stored.isOk()).toBe(true);
    if (stored.isOk() && successfulDecisions[0]?.isOk()) {
      expect(stored.value.status).toBe(successfulDecisions[0].value.status);
      expect(['APPROVED', 'REJECTED']).toContain(stored.value.status);
    }
  });

  it('should reject invalid Telegram ids before hitting Prisma', async () => {
    const result = await repository.findActiveByTelegramId('not-a-number');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('membership-management.invalid_telegram_id');
    }
  });
});
