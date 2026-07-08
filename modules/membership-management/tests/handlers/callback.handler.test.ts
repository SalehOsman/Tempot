import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@tempot/shared';
import { registerDeps } from '../../deps.context.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import type { MembershipRequestService } from '../../services/membership-request.service.js';

function request(overrides: Record<string, unknown> = {}) {
  return {
    id: 'request-1',
    telegramId: '123',
    telegramUsername: 'visitor',
    telegramFirstName: 'Visitor',
    telegramLastName: null,
    telegramLanguageCode: 'ar',
    status: 'PENDING',
    requestedAt: new Date('2026-06-22T00:00:00.000Z'),
    reviewedAt: null,
    reviewerUserId: null,
    rejectionReason: null,
    createdUserProfileId: null,
    ...overrides,
  };
}

function createService(): Pick<
  MembershipRequestService,
  'submit' | 'listPending' | 'getById' | 'approve' | 'reject'
> {
  return {
    submit: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: 'visitor',
        telegramFirstName: 'Visitor',
        telegramLastName: null,
        telegramLanguageCode: null,
        status: 'PENDING',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: null,
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    listPending: vi.fn().mockResolvedValue(ok([request()])),
    getById: vi.fn().mockResolvedValue(ok(request())),
    approve: vi.fn().mockResolvedValue(ok(request({ status: 'APPROVED' }))),
    reject: vi.fn().mockResolvedValue(ok(request({ status: 'REJECTED' }))),
  };
}

function createContext(data = 'membership:request'): Context {
  return {
    from: { id: 123, username: 'visitor', first_name: 'Visitor' },
    sessionUser: { id: 'admin-1' },
    callbackQuery: { data },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

describe('membership-management callback handler', () => {
  let service: Pick<
    MembershipRequestService,
    'submit' | 'listPending' | 'getById' | 'approve' | 'reject'
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    registerDeps({
      i18n: { t: (key: string) => key },
      membershipRequests: service,
    });
  });

  it('should submit membership request for membership request callback', async () => {
    const ctx = createContext();

    await handleCallbackQuery(ctx);

    expect(service.submit).toHaveBeenCalledWith({
      telegramId: '123',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
    });
    expect(ctx.editMessageText).toHaveBeenCalledWith('membership-management.request.submitted', {
      parse_mode: 'HTML',
    });
  });

  it('should pass unrelated callbacks to next handler', async () => {
    const next = vi.fn();
    const ctx = createContext('settings:view');

    await handleCallbackQuery(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should render pending membership requests for administrators', async () => {
    const ctx = createContext('membership:list');

    await handleCallbackQuery(ctx);

    expect(service.listPending).toHaveBeenCalledWith({ limit: 10 });
    expect(ctx.editMessageText).toHaveBeenCalledWith('membership-management.admin.list.title', {
      parse_mode: 'HTML',
      reply_markup: expect.any(Object),
    });
  });

  it('should render membership request details', async () => {
    const ctx = createContext('membership:detail:request-1');

    await handleCallbackQuery(ctx);

    expect(service.getById).toHaveBeenCalledWith('request-1');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'membership-management.admin.detail.body',
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      }),
    );
  });

  it('should approve membership request from administrator callback', async () => {
    const ctx = createContext('membership:approve:request-1');

    await handleCallbackQuery(ctx);

    expect(service.approve).toHaveBeenCalledWith({
      requestId: 'request-1',
      reviewerUserId: 'admin-1',
    });
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'membership-management.admin.approved',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should reject membership request from administrator callback', async () => {
    const ctx = createContext('membership:reject:request-1');

    await handleCallbackQuery(ctx);

    expect(service.reject).toHaveBeenCalledWith({
      requestId: 'request-1',
      reviewerUserId: 'admin-1',
      rejectionReason: 'membership-management.rejection.admin_rejected',
    });
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'membership-management.admin.rejected',
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });
});
