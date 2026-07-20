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
    const saveSession = vi.fn().mockResolvedValue(ok(undefined));
    const service = {
      ensureProfileFromApproval: vi.fn().mockResolvedValue(
        ok({
          created: true,
          user: {
            id: 'u1',
            telegramId: '9500000000001',
            role: 'USER',
            language: 'en',
          },
        }),
      ),
    };

    await createMembershipApprovalHandler(service, logger(), { getSession: vi.fn(), saveSession })({
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
    expect(saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '9500000000001',
        chatId: '9500000000001',
        role: 'USER',
        status: 'ACTIVE',
        language: 'en',
      }),
    );
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
