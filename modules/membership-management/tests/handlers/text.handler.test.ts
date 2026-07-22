import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleMembershipTextGuarded } from '../../handlers/text.handler.js';
import type { ModuleAuthorizationProvider } from '../../index.js';
import { MembershipRequestDraftStore } from '../../services/membership-request-draft.store.js';

type AuthorizationMock = ModuleAuthorizationProvider & {
  enforce: ReturnType<typeof vi.fn<ModuleAuthorizationProvider['enforce']>>;
};

function createContext(): Context {
  return {
    from: { id: 123, username: 'visitor', first_name: 'Visitor' },
    message: { text: 'Visitor User' },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

describe('membership-management text handler', () => {
  let authorization: AuthorizationMock;

  beforeEach(() => {
    vi.clearAllMocks();
    authorization = {
      enforce: vi.fn<ModuleAuthorizationProvider['enforce']>().mockResolvedValue(true),
      guard: vi.fn<ModuleAuthorizationProvider['guard']>(() => vi.fn()),
    };
    registerDeps({
      adminNotifier: { notifySubmitted: vi.fn().mockResolvedValue(undefined) },
      authorization,
      i18n: { t: (key: string) => key },
      membershipRequests: {
        submit: vi.fn(),
        listPending: vi.fn(),
        getById: vi.fn(),
        approve: vi.fn(),
        reject: vi.fn(),
      },
      requestDrafts: new MembershipRequestDraftStore(),
    });
  });

  it('should enforce authorization policy before processing text input', async () => {
    const ctx = createContext();

    await handleMembershipTextGuarded(ctx);

    expect(authorization.enforce).toHaveBeenCalledWith(ctx, {
      module: 'membership-management',
      classification: 'bootstrap',
      action: 'create',
      subject: 'membership-request',
    });
  });

  it('should abort text input handling when authorization is denied', async () => {
    authorization.enforce.mockResolvedValue(false);
    const next = vi.fn();
    const ctx = createContext();

    await handleMembershipTextGuarded(ctx, next);

    expect(authorization.enforce).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it('should delegate to text process function when authorization is granted', async () => {
    const next = vi.fn();
    const ctx = createContext();

    await handleMembershipTextGuarded(ctx, next);

    expect(authorization.enforce).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });
});
