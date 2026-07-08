import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { createMembershipApprovalHandler } from '../../events/membership-approval.handler.js';

function logger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };
}

describe('createMembershipApprovalHandler', () => {
  it('should activate a user profile from a membership approval event', async () => {
    const service = {
      ensureProfileFromApproval: vi
        .fn()
        .mockResolvedValue(ok({ created: true, user: { id: 'u1' } })),
    };

    await createMembershipApprovalHandler(
      service,
      logger(),
    )({
      requestId: 'request-1',
      telegramId: '9500000000001',
      telegramUsername: 'visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });

    expect(service.ensureProfileFromApproval).toHaveBeenCalledWith({
      requestId: 'request-1',
      telegramId: '9500000000001',
      telegramUsername: 'visitor',
      telegramLanguageCode: 'ar',
      reviewerUserId: 'admin-1',
    });
  });

  it('should reject malformed approval payloads before calling the service', async () => {
    const service = {
      ensureProfileFromApproval: vi.fn(),
    };
    const log = logger();

    await createMembershipApprovalHandler(service, log)({ requestId: 'request-1' });

    expect(service.ensureProfileFromApproval).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'membership_approval_payload_invalid',
      }),
    );
  });
});
