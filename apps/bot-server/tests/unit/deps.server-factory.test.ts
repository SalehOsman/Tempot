import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildHttpServerFactory } from '../../src/startup/deps.server-factory.js';
import { serve } from '@hono/node-server';

const close = vi.fn((callback?: (error?: Error) => void) => {
  callback?.();
});

vi.mock('@hono/node-server', () => ({
  serve: vi.fn(() => ({ close })),
}));

vi.mock('@tempot/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([]),
  },
}));

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

describe('buildHttpServerFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the Hono Node adapter and closes the created server', async () => {
    const serverFactory = buildHttpServerFactory({
      log: createMockLogger() as never,
      eventBus: {} as never,
      cache: { get: vi.fn().mockResolvedValue(null) } as never,
      settingsService: {} as never,
    });
    const server = serverFactory({} as never, {
      botToken: 'token',
      botMode: 'polling',
      port: 3000,
      superAdminIds: [],
    });

    server.listen(3000);
    await server.close();

    expect(serve).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 3000,
        fetch: expect.any(Function),
      }),
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
