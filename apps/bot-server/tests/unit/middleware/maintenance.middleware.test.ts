import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMaintenanceMiddleware } from '../../../src/bot/middleware/maintenance.middleware.js';
import type { MaintenanceDeps } from '../../../src/bot/middleware/maintenance.middleware.js';

interface MockContext {
  from: { id: number } | undefined;
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createMaintenanceMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;
  const mockT = vi.fn((key: string) => `translated:${key}`);

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('blocks non-admin users when maintenance is enabled', async () => {
    const deps: MaintenanceDeps = {
      getMaintenanceStatus: vi.fn().mockResolvedValue({
        enabled: true,
        isSuperAdmin: () => false,
      }),
      t: mockT,
    };

    const middleware = createMaintenanceMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.maintenance_mode');
    expect(next).not.toHaveBeenCalled();
  });

  it('allows SUPER_ADMIN through when maintenance is enabled', async () => {
    const deps: MaintenanceDeps = {
      getMaintenanceStatus: vi.fn().mockResolvedValue({
        enabled: true,
        isSuperAdmin: (userId: number) => userId === 123,
      }),
      t: mockT,
    };

    const middleware = createMaintenanceMiddleware(deps);
    const ctx = createMockContext({ from: { id: 123 } });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('passes all through when maintenance is disabled', async () => {
    const deps: MaintenanceDeps = {
      getMaintenanceStatus: vi.fn().mockResolvedValue({
        enabled: false,
        isSuperAdmin: () => false,
      }),
      t: mockT,
    };

    const middleware = createMaintenanceMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
