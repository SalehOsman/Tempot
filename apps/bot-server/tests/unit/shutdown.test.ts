import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerShutdownHooks, setupSignalHandlers } from '../../src/startup/shutdown.js';
import type { ShutdownManager } from '@tempot/shared';
import { AppError } from '@tempot/shared';

interface MockHook {
  (): Promise<void>;
}

const createMockShutdownManager = () => {
  const hooks: MockHook[] = [];
  return {
    register: vi.fn((hook: MockHook) => {
      hooks.push(hook);
      return { isOk: () => true, isErr: () => false, value: undefined };
    }),
    execute: vi.fn(async () => {
      for (const hook of hooks) {
        await hook();
      }
      return { isOk: () => true, isErr: () => false, value: undefined };
    }),
    _getHooks: () => hooks,
  } as unknown as ShutdownManager & { _getHooks: () => MockHook[] };
};

const createMockResources = () => ({
  httpServer: { close: vi.fn().mockResolvedValue(undefined) },
  bot: { stop: vi.fn().mockResolvedValue(undefined) },
  queueFactory: { closeAll: vi.fn().mockResolvedValue(undefined) },
  cache: { reset: vi.fn().mockResolvedValue({ isOk: () => true }) },
  prisma: { $disconnect: vi.fn().mockResolvedValue(undefined) },
  drizzlePool: { end: vi.fn().mockResolvedValue(undefined) },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  eventBus: {
    publish: vi.fn().mockResolvedValue({ isOk: () => true }),
    dispose: vi.fn().mockResolvedValue({ isOk: () => true }),
  },
});

describe('registerShutdownHooks', () => {
  let shutdownManager: ReturnType<typeof createMockShutdownManager>;
  let resources: ReturnType<typeof createMockResources>;

  beforeEach(() => {
    vi.clearAllMocks();
    shutdownManager = createMockShutdownManager();
    resources = createMockResources();
  });

  it('should register exactly 7 hooks', () => {
    registerShutdownHooks(shutdownManager, resources);

    expect(shutdownManager.register).toHaveBeenCalledTimes(7);
  });

  it('should execute hooks in correct order', async () => {
    registerShutdownHooks(shutdownManager, resources);

    const callOrder: string[] = [];
    resources.httpServer.close.mockImplementation(async () => {
      callOrder.push('httpServer.close');
    });
    resources.bot.stop.mockImplementation(async () => {
      callOrder.push('bot.stop');
    });
    resources.queueFactory.closeAll.mockImplementation(async () => {
      callOrder.push('queueFactory.closeAll');
    });
    resources.cache.reset.mockImplementation(async () => {
      callOrder.push('cache.reset');
      return { isOk: () => true };
    });
    resources.prisma.$disconnect.mockImplementation(async () => {
      callOrder.push('prisma.$disconnect');
    });
    resources.drizzlePool.end.mockImplementation(async () => {
      callOrder.push('drizzlePool.end');
    });

    const hooks = (shutdownManager as unknown as { _getHooks: () => MockHook[] })._getHooks();
    for (const hook of hooks) {
      await hook();
    }

    expect(callOrder).toEqual([
      'httpServer.close',
      'bot.stop',
      'queueFactory.closeAll',
      'cache.reset',
      'prisma.$disconnect',
      'drizzlePool.end',
    ]);
    expect(resources.logger.info).toHaveBeenCalled();
  });

  it('should skip undefined resources without throwing', async () => {
    const partialResources = {
      logger: resources.logger,
      eventBus: resources.eventBus,
    };

    registerShutdownHooks(shutdownManager, partialResources);

    const hooks = (shutdownManager as unknown as { _getHooks: () => MockHook[] })._getHooks();
    for (const hook of hooks) {
      await hook();
    }

    expect(shutdownManager.register).toHaveBeenCalledTimes(7);
  });

  it('should log warning when register returns error', () => {
    const failingManager = {
      register: vi.fn(() => ({
        isOk: () => false,
        isErr: () => true,
        error: { code: 'test.error' },
      })),
      execute: vi.fn(),
    } as unknown as ShutdownManager;

    registerShutdownHooks(failingManager, resources);

    expect(resources.logger.warn).toHaveBeenCalled();
  });

  it('should return ok result when all hooks register successfully (W6)', () => {
    const result = registerShutdownHooks(shutdownManager, resources);

    expect(result.isOk()).toBe(true);
  });

  it('should return err result when a hook registration fails (W6)', () => {
    const failingManager = {
      register: vi.fn(() => ({
        isOk: () => false,
        isErr: () => true,
        error: new AppError('shutdown.hook_registration_failed'),
      })),
      execute: vi.fn(),
    } as unknown as ShutdownManager;

    const result = registerShutdownHooks(failingManager, resources);

    expect(result.isErr()).toBe(true);
  });
});

describe('setupSignalHandlers', () => {
  let shutdownManager: ReturnType<typeof createMockShutdownManager>;
  let resources: ReturnType<typeof createMockResources>;
  let mockProcess: {
    on: ReturnType<typeof vi.fn>;
    exit: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    shutdownManager = createMockShutdownManager();
    resources = createMockResources();
    mockProcess = {
      on: vi.fn(),
      exit: vi.fn(),
    };
  });

  it('should register SIGTERM and SIGINT listeners', () => {
    setupSignalHandlers(shutdownManager, resources, mockProcess);

    const registeredSignals = mockProcess.on.mock.calls.map((call) => call[0] as string);
    expect(registeredSignals).toContain('SIGTERM');
    expect(registeredSignals).toContain('SIGINT');
  });

  it('should publish shutdown.initiated event on signal', async () => {
    setupSignalHandlers(shutdownManager, resources, mockProcess);

    const sigtermCall = mockProcess.on.mock.calls.find((call) => call[0] === 'SIGTERM');
    expect(sigtermCall).toBeDefined();

    const handler = sigtermCall![1] as () => void;
    handler();

    await vi.waitFor(() => {
      expect(resources.eventBus.publish).toHaveBeenCalledWith(
        'system.shutdown.initiated',
        expect.objectContaining({ reason: 'SIGTERM' }),
      );
    });
  });

  it('should ignore second signal during shutdown', async () => {
    setupSignalHandlers(shutdownManager, resources, mockProcess);

    const sigtermCall = mockProcess.on.mock.calls.find((call) => call[0] === 'SIGTERM');
    const handler = sigtermCall![1] as () => void;

    handler();
    handler();

    await vi.waitFor(() => {
      expect(shutdownManager.execute).toHaveBeenCalledTimes(1);
    });
  });

  it('should call process.exit(0) after shutdown', async () => {
    setupSignalHandlers(shutdownManager, resources, mockProcess);

    const sigtermCall = mockProcess.on.mock.calls.find((call) => call[0] === 'SIGTERM');
    const handler = sigtermCall![1] as () => void;

    handler();

    await vi.waitFor(() => {
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });
  });

  it('should return ok result when signal handlers are registered (W6)', () => {
    const result = setupSignalHandlers(shutdownManager, resources, mockProcess);

    expect(result.isOk()).toBe(true);
  });
});
