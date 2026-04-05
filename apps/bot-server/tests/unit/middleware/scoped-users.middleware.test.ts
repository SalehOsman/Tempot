import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScopedUsersMiddleware } from '../../../src/bot/middleware/scoped-users.middleware.js';
import type { ScopedUsersDeps } from '../../../src/bot/middleware/scoped-users.middleware.js';

interface MockMessage {
  text?: string;
  from: { id: number };
}

interface MockContext {
  message?: MockMessage;
  from: { id: number } | undefined;
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    message: { text: '/test', from: { id: 123 } },
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createScopedUsersMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;
  const mockT = vi.fn((key: string) => `translated:${key}`);

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('blocks unlisted users from module with scopedUsers list', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('admin', { scopedUsers: [999, 888] });

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/admin', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.not_authorized');
  });

  it('allows listed users', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('admin', { scopedUsers: [123, 456] });

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/admin', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('skips when scopedUsers is undefined', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('help', {});

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/help', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('skips when scopedUsers is empty', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('help', { scopedUsers: [] });

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/help', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks SUPER_ADMIN if not in scoped list (D13)', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('restricted', { scopedUsers: [999] });

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    // SUPER_ADMIN user ID 777 is NOT in the scopedUsers list
    const ctx = createMockContext({
      message: { text: '/restricted', from: { id: 777 } },
      from: { id: 777 },
    });

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.not_authorized');
  });

  it('passes non-command messages through', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: 'just a message', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('strips @botname from command before lookup', async () => {
    const commandModuleMap = new Map<string, { scopedUsers?: number[] }>();
    commandModuleMap.set('start', { scopedUsers: [123] });

    const deps: ScopedUsersDeps = { commandModuleMap, t: mockT };
    const middleware = createScopedUsersMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/start@mybot', from: { id: 123 } },
      from: { id: 123 },
    });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
