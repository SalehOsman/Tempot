import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@tempot/shared';
import { registerDeps, type MembershipManagementDeps } from '../../deps.context.js';
import { requestMembershipCommand } from '../../commands/request-membership.command.js';
import type { ModuleAuthorizationProvider } from '../../index.js';
import { MembershipRequestDraftStore } from '../../services/membership-request-draft.store.js';

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
      adminNotifier: { notifySubmitted: vi.fn().mockResolvedValue(undefined) },
      authorization: createAuthorization(),
      i18n: { t: (key: string) => key },
      membershipRequests: service,
      requestDrafts: new MembershipRequestDraftStore(),
    });
  });

  it('should start membership data collection from Telegram identity', async () => {
    const ctx = createContext();

    await requestMembershipCommand(ctx);

    expect(service.submit).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('membership-management.request.prompt.full_name', {
      parse_mode: 'HTML',
    });
  });

  it('should reply with identity error when Telegram identity is missing', async () => {
    const ctx = createContext(null);

    await requestMembershipCommand(ctx);

    expect(service.submit).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('membership-management.request.identity_missing');
  });
});
