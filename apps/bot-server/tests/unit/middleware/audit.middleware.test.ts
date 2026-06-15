import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuditMiddleware } from '../../../src/bot/middleware/audit.middleware.js';
import type { AuditDeps } from '../../../src/bot/middleware/audit.middleware.js';

interface MockMessage {
  text?: string;
  from: { id: number };
}

interface MockContext {
  message?: MockMessage;
  callbackQuery?: { data?: string };
  update?: { update_id: number };
  from: { id: number };
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    message: { text: '/start', from: { id: 123 } },
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createAuditMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('logs request result with user ID and action after handler completes', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(mockAuditLog).toHaveBeenCalledWith({
      action: '/start',
      module: 'bot-server',
      userId: '123',
      status: 'SUCCESS',
    });
  });

  it('logs FAILURE status when handler throws', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };
    const handlerError = new Error('handler failed');
    next = vi.fn().mockRejectedValue(handlerError);

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext();

    await expect(middleware(ctx as never, next)).rejects.toThrow('handler failed');

    expect(mockAuditLog).toHaveBeenCalledWith({
      action: '/start',
      module: 'bot-server',
      userId: '123',
      status: 'FAILURE',
    });
  });

  it('handles audit failure gracefully (no error propagation to user)', async () => {
    const mockAuditLog = vi.fn().mockRejectedValue(new Error('audit DB down'));
    const deps: AuditDeps = { auditLog: mockAuditLog };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext();

    // Should NOT throw even though audit logging fails
    await expect(middleware(ctx as never, next)).resolves.toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('uses "message" as action for non-command text', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext({
      message: { text: 'hello world', from: { id: 123 } },
    });

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'message' }));
  });

  it('includes userRole from sessionUser on context', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext() as MockContext & Record<string, unknown>;
    ctx['sessionUser'] = { id: '123', role: 'USER' };

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userRole: 'USER' }));
  });

  it('resolves module name from commandModuleMap when command matches', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = {
      auditLog: mockAuditLog,
      commandModuleMap: { '/settings': 'settings-module', '/help': 'help-module' },
    };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/settings arg1', from: { id: 123 } },
    });

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'settings-module', action: '/settings' }),
    );
  });

  it('falls back to "bot-server" when command is not in commandModuleMap', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = {
      auditLog: mockAuditLog,
      commandModuleMap: { '/settings': 'settings-module' },
    };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/unknown', from: { id: 123 } },
    });

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'bot-server', action: '/unknown' }),
    );
  });

  it('uses "bot-server" as module when commandModuleMap is not provided', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };

    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext({
      message: { text: '/start', from: { id: 123 } },
    });

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(expect.objectContaining({ module: 'bot-server' }));
  });

  it('logs callback data as the audit action with trace metadata', async () => {
    const mockAuditLog = vi.fn().mockResolvedValue(undefined);
    const deps: AuditDeps = { auditLog: mockAuditLog };
    const ctx = createMockContext({
      message: undefined,
      callbackQuery: { data: 'users:list' },
      update: { update_id: 99 },
    }) as MockContext & Record<string, unknown>;
    ctx['interactionTrace'] = {
      traceId: 'trace-1',
      updateId: 99,
      updateType: 'callback_query',
      callbackData: 'users:list',
      callbackNamespace: 'users',
      module: 'user-management',
      userId: 123,
      chatId: 456,
      responseCount: 0,
      eventCount: 0,
      startedAt: 100,
    };

    const middleware = createAuditMiddleware(deps);

    await middleware(ctx as never, next);

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'users:list',
        module: 'user-management',
        targetId: 'trace-1',
        status: 'SUCCESS',
        after: expect.objectContaining({
          callbackData: 'users:list',
          callbackNamespace: 'users',
          traceId: 'trace-1',
        }),
      }),
    );
  });

  it('logs audit persistence failures without blocking the interaction', async () => {
    const mockAuditLog = vi.fn().mockRejectedValue(new Error('audit down'));
    const logger = { warn: vi.fn() };
    const deps: AuditDeps = { auditLog: mockAuditLog, logger };
    const middleware = createAuditMiddleware(deps);
    const ctx = createMockContext();

    await expect(middleware(ctx as never, next)).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'bot-server.audit_log_failed',
        action: '/start',
      }),
    );
  });
});
