import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShutdownManager } from '../../src/shutdown/shutdown.manager';

describe('ShutdownManager', () => {
  beforeEach(() => {
    // Reset hooks before each test
    // Since ShutdownManager is static, we need a way to clear it
    // or we'll have side effects across tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ShutdownManager as any).hooks = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute registered hooks on shutdown', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    ShutdownManager.register(hook);
    await ShutdownManager.execute();
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

    ShutdownManager.register(hook1);
    ShutdownManager.register(hook2);

    await ShutdownManager.execute();

    expect(order).toEqual([1, 2]);
  });

  it('should handle errors in hooks without stopping execution of subsequent hooks', async () => {
    const hook1 = vi.fn().mockRejectedValue(new Error('Hook 1 failed'));
    const hook2 = vi.fn().mockResolvedValue(undefined);

    ShutdownManager.register(hook1);
    ShutdownManager.register(hook2);

    await ShutdownManager.execute();

    expect(hook1).toHaveBeenCalled();
    expect(hook2).toHaveBeenCalled();
  });

  it('should exit with code 1 if hooks take longer than 30s', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const slowHook = () =>
      new Promise<void>((_resolve) => {
        // Never resolve
      });

    ShutdownManager.register(slowHook);

    // We don't await this because it will hang
    ShutdownManager.execute();

    // Fast forward 30 seconds
    vi.advanceTimersByTime(30000);

    expect(mockConsoleError).toHaveBeenCalledWith(
      'FATAL: Shutdown exceeded 30s timeout. Forcing exit.',
    );
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });
});
