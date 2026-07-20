import { describe, expect, it, vi } from 'vitest';
import { createMongoAbility } from '@casl/ability';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import { createAccessGateMiddleware } from '../../../src/bot/middleware/access-gate.middleware.js';
import type { AccessGateDeps } from '../../../src/bot/middleware/access-gate.middleware.js';

interface MockContext {
  message?: { text?: string };
  callbackQuery?: { data?: string };
  reply: ReturnType<typeof vi.fn>;
  sessionUser?: SessionUser;
  ability?: ReturnType<typeof createMongoAbility>;
}

function createDeps(overrides: Partial<AccessGateDeps> = {}): AccessGateDeps {
  return {
    getAccessMode: vi.fn().mockReturnValue('private'),
    t: vi.fn((key: string) => `translated:${key}`),
    logger: { warn: vi.fn() },
    auditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    message: { text: '/settings' },
    reply: vi.fn().mockResolvedValue(undefined),
    sessionUser: {
      id: '123',
      role: RoleEnum.GUEST,
      status: 'UNRESOLVED',
    },
    ...overrides,
  };
}

describe('createAccessGateMiddleware', () => {
  it('should allow bootstrap start command for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({ message: { text: '/start' } });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should allow bootstrap join command for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({ message: { text: '/join' } });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should deny protected commands for unresolved guests in private mode', async () => {
    const deps = createDeps();
    const ctx = createContext({ message: { text: '/settings' } });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'access_gate_denied',
        capabilityId: 'command.settings',
      }),
    );
  });

  it('should deny protected commands for pending visitors', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: { text: '/settings' },
      sessionUser: {
        id: 'pending-1',
        role: RoleEnum.GUEST,
        status: 'PENDING',
      },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
    expect(deps.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'access.denied',
        targetId: 'command.settings',
        status: 'DENIED',
        userId: 'pending-1',
        after: expect.objectContaining({
          actorState: 'PENDING',
          reason: 'membership_pending',
        }),
      }),
    );
  });

  it('should audit denied protected command attempts', async () => {
    const deps = createDeps();
    const ctx = createContext({ message: { text: '/settings' } });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(deps.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'access.denied',
        module: 'bot-server',
        targetId: 'command.settings',
        status: 'DENIED',
        userId: '123',
        userRole: RoleEnum.GUEST,
        after: expect.objectContaining({
          actorState: 'UNKNOWN',
          capabilityId: 'command.settings',
          reason: 'profile_not_found',
        }),
      }),
    );
  });

  it('should allow public commands for unresolved guests in public mode', async () => {
    const deps = createDeps({ getAccessMode: vi.fn().mockReturnValue('public') });
    const ctx = createContext({ message: { text: '/help' } });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should allow protected commands for users with matching CASL ability', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: { text: '/settings' },
      sessionUser: {
        id: 'user-1',
        role: RoleEnum.USER,
        status: 'ACTIVE',
      },
      ability: createMongoAbility([{ action: 'read', subject: 'settings' }]),
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should deny protected callbacks when the actor lacks the namespace ability', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'messages:view' },
      sessionUser: {
        id: 'user-1',
        role: RoleEnum.USER,
        status: 'ACTIVE',
      },
      ability: createMongoAbility([{ action: 'read', subject: 'profile' }]),
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
  });

  it('should deny stale callbacks after the actor loses the required ability', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'settings:view' },
      sessionUser: {
        id: 'user-1',
        role: RoleEnum.USER,
        status: 'ACTIVE',
      },
      ability: createMongoAbility([{ action: 'read', subject: 'profile' }]),
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
    expect(deps.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'access.denied',
        targetId: 'callback.settings',
        status: 'DENIED',
        after: expect.objectContaining({
          capabilityId: 'callback.settings',
          reason: 'missing_ability',
        }),
      }),
    );
  });

  it('should allow protected commands for super admins with manage all ability', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: { text: '/users' },
      sessionUser: {
        id: 'admin-1',
        role: RoleEnum.SUPER_ADMIN,
        status: 'ACTIVE',
      },
      ability: createMongoAbility([{ action: 'manage', subject: 'all' }]),
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should deny callbacks for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'settings:open' },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
  });

  it('should allow membership request callbacks for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'membership:request' },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should allow membership request reason skip callbacks for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'membership:request:reason:skip' },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should deny membership administration callbacks for unresolved guests', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'membership:list' },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.access_denied');
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'access_gate_denied',
        capabilityId: 'callback.membership',
      }),
    );
  });

  it('should audit denied admin callback attempts', async () => {
    const deps = createDeps();
    const ctx = createContext({
      message: undefined,
      callbackQuery: { data: 'membership:list' },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await createAccessGateMiddleware(deps)(ctx as never, next);

    expect(deps.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'access.denied',
        module: 'bot-server',
        targetId: 'callback.membership',
        status: 'DENIED',
        after: expect.objectContaining({
          classification: 'admin',
          reason: 'profile_not_found',
        }),
      }),
    );
  });
});
