import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@tempot/shared';
import { registerDeps, type MembershipManagementDeps } from '../../deps.context.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import {
  handleMembershipText,
  MEMBERSHIP_REASON_SKIP_CALLBACK,
  startMembershipRequestFlow,
} from '../../handlers/membership-request-flow.handler.js';
import type { ModuleAuthorizationProvider } from '../../index.js';
import { MembershipRequestDraftStore } from '../../services/membership-request-draft.store.js';

type MembershipRequestServicePort = MembershipManagementDeps['membershipRequests'];

function request(overrides: Record<string, unknown> = {}) {
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

function createService(): MembershipRequestServicePort {
  return {
    submit: vi.fn().mockResolvedValue(ok(request())),
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

function createContext(text?: string, callbackData?: string): Context {
  return {
    from: visitor(),
    callbackQuery: callbackData === undefined ? undefined : { data: callbackData },
    message: text === undefined ? undefined : { text },
    editMessageText: vi.fn().mockResolvedValue(undefined),
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

describe('membership request flow handler', () => {
  let service: MembershipRequestServicePort;
  let adminNotifier: MembershipManagementDeps['adminNotifier'];

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    adminNotifier = { notifySubmitted: vi.fn().mockResolvedValue(undefined) };
    registerDeps({
      adminNotifier,
      authorization: createAuthorization(),
      i18n: { t: (key: string) => key },
      membershipRequests: service,
      requestDrafts: new MembershipRequestDraftStore(),
    });
  });

  it('should collect request data before submission and notify admins', async () => {
    await startMembershipRequestFlow(createContext());
    await handleMembershipText(createContext('Visitor User'));
    await handleMembershipText(createContext('Visitor'));
    await handleMembershipText(createContext('01012345678'));
    const reasonCtx = createContext('Need access');

    await handleMembershipText(reasonCtx);

    expect(service.submit).toHaveBeenCalledWith({
      telegramId: '123',
      fullName: 'Visitor User',
      nickname: 'Visitor',
      mobileNumber: '01012345678',
      telegramUsername: 'visitor',
      telegramFirstName: 'Visitor',
      telegramLastName: 'User',
      telegramLanguageCode: 'en',
      requestMessage: 'Need access',
    });
    expect(adminNotifier.notifySubmitted).toHaveBeenCalledWith(request());
    expect(reasonCtx.reply).toHaveBeenCalledWith('membership-management.request.submitted', {
      parse_mode: 'HTML',
    });
  });

  it('should allow skipping the optional request reason', async () => {
    await startMembershipRequestFlow(createContext());
    await handleMembershipText(createContext('Visitor User'));
    await handleMembershipText(createContext('Visitor'));
    await handleMembershipText(createContext('01012345678'));
    const skipCtx = createContext(undefined, MEMBERSHIP_REASON_SKIP_CALLBACK);

    await handleCallbackQuery(skipCtx);

    expect(service.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramId: '123',
        fullName: 'Visitor User',
        nickname: 'Visitor',
        mobileNumber: '01012345678',
      }),
    );
  });
});
