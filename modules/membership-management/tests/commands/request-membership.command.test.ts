import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok, AppError } from '@tempot/shared';
import { registerDeps, type MembershipManagementDeps } from '../../deps.context.js';
import { requestMembershipCommand } from '../../commands/request-membership.command.js';
import type { ModuleAuthorizationProvider } from '../../index.js';

type MembershipRequestServicePort = MembershipManagementDeps['membershipRequests'];

function createService(): MembershipRequestServicePort {
  return {
    submit: vi.fn().mockResolvedValue(
      ok({
        id: 'request-1',
        telegramId: '123',
        telegramUsername: 'visitor',
        telegramFirstName: 'Visitor',
        telegramLastName: null,
        telegramLanguageCode: 'en',
        status: 'PENDING',
        requestedAt: new Date('2026-06-22T00:00:00.000Z'),
        reviewedAt: null,
        reviewerUserId: null,
        rejectionReason: null,
        createdUserProfileId: null,
      }),
    ),
    listPending: vi.fn(),
    getById: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  };
}

function createAuthorization(): MembershipManagementDeps['authorization'] {
  return {
    enforce: vi.fn<ModuleAuthorizationProvider['enforce']>().mockResolvedValue(true),
    guard: vi.fn<ModuleAuthorizationProvider['guard']>(() => vi.fn()),
  };
}

function createContext(from: Context['from'] | null = visitor()): Context {
  return {
    ...(from === null ? {} : { from }),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function visitor(): NonNullable<Context['from']> {
  return {
    id: 123,
    username: 'visitor',
    first_name: 'Visitor',
    last_name: 'User',
    language_code: 'en',
    is_bot: false,
  };
}

describe('requestMembershipCommand', () => {
  let service: MembershipRequestServicePort;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    registerDeps({
      authorization: createAuthorization(),
      i18n: { t: (key: string) => key },
      membershipRequests: service,
    });
  });

  it('should submit a membership request from Telegram identity', async () => {
    const ctx = createContext();

    await requestMembershipCommand(ctx);

    expect(service.submit).toHaveBeenCalledWith({
      telegramId: '123',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
      telegramLastName: 'User',
      telegramLanguageCode: 'en',
    });
    expect(ctx.reply).toHaveBeenCalledWith('membership-management.request.submitted', {
      parse_mode: 'HTML',
    });
  });

  it('should reply with identity error when Telegram identity is missing', async () => {
    const ctx = createContext(null);

    await requestMembershipCommand(ctx);

    expect(service.submit).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('membership-management.request.identity_missing');
  });

  it('should reply with failure message when submission fails', async () => {
    service.submit = vi
      .fn()
      .mockResolvedValue(err(new AppError('membership-management.create_failed')));
    const ctx = createContext();

    await requestMembershipCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('membership-management.request.failed');
  });
});
