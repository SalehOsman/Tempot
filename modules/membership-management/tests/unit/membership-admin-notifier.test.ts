import { describe, expect, it, vi } from 'vitest';
import { createMembershipAdminNotifier } from '../../services/membership-admin-notifier.js';
import type { MembershipRequest } from '../../types/membership-request.types.js';

function request(overrides: Partial<MembershipRequest> = {}): MembershipRequest {
  return {
    id: 'request-1',
    telegramId: '123',
    fullName: 'Visitor User',
    nickname: 'Visitor',
    mobileNumber: '01012345678',
    telegramUsername: 'visitor',
    telegramFirstName: 'Visitor',
    telegramLastName: 'User',
    telegramLanguageCode: 'en',
    requestMessage: 'Need access',
    status: 'PENDING',
    requestedAt: new Date('2026-06-22T00:00:00.000Z'),
    reviewedAt: null,
    reviewerUserId: null,
    rejectionReason: null,
    createdUserProfileId: null,
    ...overrides,
  };
}

describe('createMembershipAdminNotifier', () => {
  it('sends submitted membership requests to every configured super admin', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const t = vi.fn((key: string) => key);
    const notifier = createMembershipAdminNotifier({
      api: { sendMessage },
      logger: { warn: vi.fn() },
      superAdminIds: [100, 200],
      t,
    });

    await notifier.notifySubmitted(request());

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(
      1,
      100,
      'membership-management.admin.notification.submitted',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      200,
      'membership-management.admin.notification.submitted',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
    expect(t).toHaveBeenCalledWith(
      'membership-management.admin.notification.submitted',
      expect.objectContaining({
        fullName: 'Visitor User',
        mobileNumber: '01012345678',
        telegramId: '123',
      }),
    );
  });

  it('logs failed admin notifications without blocking the remaining recipients', async () => {
    const logger = { warn: vi.fn() };
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('bot blocked'))
      .mockResolvedValueOnce(undefined);
    const notifier = createMembershipAdminNotifier({
      api: { sendMessage },
      logger,
      superAdminIds: [100, 200],
      t: (key: string) => key,
    });

    await notifier.notifySubmitted(request({ fullName: null, requestMessage: null }));

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith({
      msg: 'membership-management.admin_notification_failed',
      adminId: 100,
      requestId: 'request-1',
      error: 'bot blocked',
    });
  });
});
