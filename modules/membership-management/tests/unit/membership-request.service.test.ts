import { describe, expect, it, vi } from 'vitest';
import { ok } from '@tempot/shared';
import { MembershipRequestService } from '../../services/membership-request.service.js';
import type { MembershipRequestRepository } from '../../repositories/membership-request.repository.types.js';
import type { MembershipEventBus } from '../../types/module-deps.types.js';

function repository(
  overrides: Partial<MembershipRequestRepository> = {},
): MembershipRequestRepository {
  return {
    findActiveByTelegramId: vi.fn().mockResolvedValue(ok(null)),
    findRequestById: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: 'visitor',
        telegramFirstName: null,
        telegramLastName: null,
        telegramLanguageCode: 'ar',
        status: 'PENDING',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: null,
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    listPending: vi.fn().mockResolvedValue(
      ok([
        {
          id: 'request-1',
          telegramId: '123',
          telegramUsername: 'visitor',
          telegramFirstName: null,
          telegramLastName: null,
          telegramLanguageCode: 'ar',
          status: 'PENDING',
          requestedAt: new Date('2026-06-22T00:00:00.000Z'),
          reviewedAt: null,
          reviewerUserId: null,
          rejectionReason: null,
          createdUserProfileId: null,
        },
      ]),
    ),
    createRequest: vi.fn().mockImplementation(async (input) =>
      ok({
        id: 'request-1',
        telegramId: input.telegramId,
        telegramUsername: input.telegramUsername ?? null,
        telegramFirstName: input.telegramFirstName ?? null,
        telegramLastName: input.telegramLastName ?? null,
        telegramLanguageCode: input.telegramLanguageCode ?? null,
        status: 'PENDING',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: null,
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    updatePendingDetails: vi.fn().mockImplementation(async (requestId, input) =>
      ok({
        id: requestId,
        telegramId: input.telegramId,
        fullName: input.fullName ?? null,
        nickname: input.nickname ?? null,
        mobileNumber: input.mobileNumber ?? null,
        telegramUsername: input.telegramUsername ?? null,
        telegramFirstName: input.telegramFirstName ?? null,
        telegramLastName: input.telegramLastName ?? null,
        telegramLanguageCode: input.telegramLanguageCode ?? null,
        requestMessage: input.requestMessage ?? null,
        status: 'PENDING',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: null,
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    markApproved: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: 'visitor',
        telegramFirstName: null,
        telegramLastName: null,
        telegramLanguageCode: 'ar',
        status: 'APPROVED',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: new Date('2026-06-22T00:05:00.000Z'),
        reviewerUserId: 'admin-1',
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    markRejected: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: null,
        telegramFirstName: null,
        telegramLastName: null,
        telegramLanguageCode: null,
        status: 'REJECTED',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: new Date('2026-06-22T00:05:00.000Z'),
        reviewerUserId: 'admin-1',
        rejectionReason: 'not enough information',
        createdUserProfileId: null,
      }),
    ),
    markCancelled: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: null,
        telegramFirstName: null,
        telegramLastName: null,
        telegramLanguageCode: null,
        status: 'CANCELLED',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: new Date('2026-06-22T00:05:00.000Z'),
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    markExpired: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: null,
        telegramFirstName: null,
        telegramLastName: null,
        telegramLanguageCode: null,
        status: 'EXPIRED',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: new Date('2026-06-22T00:05:00.000Z'),
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    ...overrides,
  };
}

function eventBus(): MembershipEventBus {
  return { publish: vi.fn().mockResolvedValue(ok(undefined)) };
}

describe('MembershipRequestService', () => {
  it('should create pending request when no active request exists', async () => {
    const repo = repository();
    const bus = eventBus();
    const service = new MembershipRequestService({ repository: repo, eventBus: bus });

    const result = await service.submit({
      telegramId: '123',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe('PENDING');
      expect(result.value.telegramId).toBe('123');
    }
    expect(repo.createRequest).toHaveBeenCalledWith({
      telegramId: '123',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
    });
    expect(bus.publish).toHaveBeenCalledWith(
      'membership-management.request.submitted',
      expect.objectContaining({ requestId: 'request-1', telegramId: '123' }),
    );
  });

  it('should list pending membership requests for administrator review', async () => {
    const repo = repository();
    const service = new MembershipRequestService({ repository: repo, eventBus: eventBus() });

    const result = await service.listPending({ limit: 5 });

    expect(result.isOk()).toBe(true);
    expect(repo.listPending).toHaveBeenCalledWith({ limit: 5 });
  });

  it('should load a membership request for administrator detail view', async () => {
    const repo = repository();
    const service = new MembershipRequestService({ repository: repo, eventBus: eventBus() });

    const result = await service.getById('request-1');

    expect(result.isOk()).toBe(true);
    expect(repo.findRequestById).toHaveBeenCalledWith('request-1');
  });

  it('should update existing pending request without creating duplicate', async () => {
    const existing = {
      id: 'request-existing',
      telegramId: '123',
      telegramUsername: 'visitor',
      telegramFirstName: null,
      telegramLastName: null,
      telegramLanguageCode: null,
      status: 'PENDING' as const,
      requestedAt: new Date('2026-06-22T00:00:00.000Z'),
      reviewedAt: null,
      reviewerUserId: null,
      rejectionReason: null,
      createdUserProfileId: null,
    };
    const repo = repository({
      findActiveByTelegramId: vi.fn().mockResolvedValue(ok(existing)),
    });
    const service = new MembershipRequestService({ repository: repo, eventBus: eventBus() });

    const result = await service.submit({
      telegramId: '123',
      fullName: 'Visitor User',
      nickname: 'Visitor',
      mobileNumber: '01012345678',
      requestMessage: 'Need access',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe('request-existing');
      expect(result.value.fullName).toBe('Visitor User');
      expect(result.value.mobileNumber).toBe('01012345678');
    }
    expect(repo.createRequest).not.toHaveBeenCalled();
    expect(repo.updatePendingDetails).toHaveBeenCalledWith('request-existing', {
      telegramId: '123',
      fullName: 'Visitor User',
      nickname: 'Visitor',
      mobileNumber: '01012345678',
      requestMessage: 'Need access',
    });
  });

  it('should approve pending request and publish approval event', async () => {
    const repo = repository();
    const bus = eventBus();
    const service = new MembershipRequestService({ repository: repo, eventBus: bus });

    const result = await service.approve({ requestId: 'request-1', reviewerUserId: 'admin-1' });

    expect(result.isOk()).toBe(true);
    expect(repo.markApproved).toHaveBeenCalledWith({
      requestId: 'request-1',
      reviewerUserId: 'admin-1',
    });
    expect(bus.publish).toHaveBeenCalledWith(
      'membership-management.request.approved',
      expect.objectContaining({
        requestId: 'request-1',
        telegramId: '123',
        telegramUsername: 'visitor',
        telegramLanguageCode: 'ar',
        reviewerUserId: 'admin-1',
      }),
    );
  });

  it('should reject pending request and publish rejection event', async () => {
    const repo = repository();
    const bus = eventBus();
    const service = new MembershipRequestService({ repository: repo, eventBus: bus });

    const result = await service.reject({
      requestId: 'request-1',
      reviewerUserId: 'admin-1',
      rejectionReason: 'not enough information',
    });

    expect(result.isOk()).toBe(true);
    expect(repo.markRejected).toHaveBeenCalledWith({
      requestId: 'request-1',
      reviewerUserId: 'admin-1',
      rejectionReason: 'not enough information',
    });
    expect(bus.publish).toHaveBeenCalledWith(
      'membership-management.request.rejected',
      expect.objectContaining({ requestId: 'request-1', reviewerUserId: 'admin-1' }),
    );
  });

  it('should cancel pending request and publish cancellation event', async () => {
    const repo = repository();
    const bus = eventBus();
    const service = new MembershipRequestService({ repository: repo, eventBus: bus });

    const result = await service.cancel({ requestId: 'request-1' });

    expect(result.isOk()).toBe(true);
    expect(repo.markCancelled).toHaveBeenCalledWith({ requestId: 'request-1' });
    expect(bus.publish).toHaveBeenCalledWith(
      'membership-management.request.cancelled',
      expect.objectContaining({ requestId: 'request-1', telegramId: '123' }),
    );
  });

  it('should expire pending request and publish expiration event', async () => {
    const repo = repository();
    const bus = eventBus();
    const service = new MembershipRequestService({ repository: repo, eventBus: bus });

    const result = await service.expire({ requestId: 'request-1' });

    expect(result.isOk()).toBe(true);
    expect(repo.markExpired).toHaveBeenCalledWith({ requestId: 'request-1' });
    expect(bus.publish).toHaveBeenCalledWith(
      'membership-management.request.expired',
      expect.objectContaining({ requestId: 'request-1', telegramId: '123' }),
    );
  });
});
