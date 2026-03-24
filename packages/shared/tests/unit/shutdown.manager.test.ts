import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShutdownManager } from '../../src/shutdown/shutdown.manager';
import { AppError } from '../../src/errors';

/**
 * Logger interface matching what ShutdownManager expects
 */
interface ShutdownLogger {
  info: (message: string) => void;
  error: (data: Record<string, unknown>) => void;
}

function createMockLogger(): ShutdownLogger {
  return {
    info: vi.fn(),
    error: vi.fn(),
  };
}

describe('ShutdownManager', () => {
  let manager: ShutdownManager;
  let logger: ShutdownLogger;

  beforeEach(() => {
    logger = createMockLogger();
    manager = new ShutdownManager(logger);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be instantiated with a logger', () => {
    expect(manager).toBeInstanceOf(ShutdownManager);
  });

  it('register() should return ok Result', () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    const result = manager.register(hook);
    expect(result.isOk()).toBe(true);
  });

  it('should execute registered hooks on shutdown', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    manager.register(hook);

    const result = await manager.execute();

    expect(result.isOk()).toBe(true);
    expect(hook).toHaveBeenCalled();
  });

  it('should execute hooks in registration order (FIFO)', async () => {
    const order: number[] = [];
    const hook1 = vi.fn().mockImplementation(async () => {
      order.push(1);
    });
    const hook2 = vi.fn().mockImplementation(async () => {
      order.push(2);
    });

    manager.register(hook1);
    manager.register(hook2);

    await manager.execute();

    expect(order).toEqual([1, 2]);
  });

  it('should return err Result when a hook fails but continue executing remaining hooks', async () => {
    const hook1 = vi.fn().mockRejectedValue(new Error('Hook 1 failed'));
    const hook2 = vi.fn().mockResolvedValue(undefined);

    manager.register(hook1);
    manager.register(hook2);

    const result = await manager.execute();

    // Should return err because a hook failed
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe('shared.shutdown_hook_failed');
    }

    // But both hooks should have been called
    expect(hook1).toHaveBeenCalled();
    expect(hook2).toHaveBeenCalled();
  });

  it('should log via injected logger, not console', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    manager.register(hook);

    await manager.execute();

    expect(logger.info).toHaveBeenCalled();
  });

  it('should log errors via injected logger when hook fails', async () => {
    const hook = vi.fn().mockRejectedValue(new Error('Hook failed'));
    manager.register(hook);

    await manager.execute();

    expect(logger.error).toHaveBeenCalled();
  });

  it('clearHooks should remove all registered hooks', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    manager.register(hook);
    manager.clearHooks();

    const result = await manager.execute();

    expect(result.isOk()).toBe(true);
    expect(hook).not.toHaveBeenCalled();
  });

  it('should force exit with code 1 if hooks exceed 30s timeout', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const slowHook = () =>
      new Promise<void>((_resolve) => {
        // Never resolve
      });

    manager.register(slowHook);

    // Don't await — it will hang
    manager.execute();

    // Fast forward 30 seconds
    vi.advanceTimersByTime(30000);

    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    stderrSpy.mockRestore();
  });

  it('execute() with no hooks should return ok', async () => {
    const result = await manager.execute();
    expect(result.isOk()).toBe(true);
  });
});
