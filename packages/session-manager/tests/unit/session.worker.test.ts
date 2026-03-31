import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import type { ShutdownManager } from '@tempot/shared';

// We mock bullmq and @tempot/database so no real connections are created.
vi.mock('bullmq', () => {
  const mockClose = vi.fn().mockResolvedValue(undefined);
  class MockWorker {
    close = mockClose;
    constructor(
      public name: string,
      public processor: unknown,
      public opts: unknown,
    ) {}
  }
  return {
    Worker: MockWorker,
    Job: vi.fn(),
    __mockClose: mockClose,
  };
});

vi.mock('@tempot/database', () => {
  class MockBaseRepository {
    findById = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
  }
  return {
    prisma: {},
    BaseRepository: MockBaseRepository,
  };
});

describe('createSessionWorker', () => {
  let createSessionWorker: typeof import('../../src/session.worker.js').createSessionWorker;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const workerModule = await import('../../src/session.worker.js');
    createSessionWorker = workerModule.createSessionWorker;
    const bullmq = await import('bullmq');
    mockClose = (bullmq as unknown as { __mockClose: ReturnType<typeof vi.fn> }).__mockClose;
  });

  it('should register worker.close as a shutdown hook when shutdownManager is provided', () => {
    const registerMock = vi.fn().mockReturnValue(ok(undefined));
    const shutdownManager = { register: registerMock } as unknown as ShutdownManager;

    createSessionWorker({
      shutdownManager,
      connection: { host: 'localhost', port: 6379 },
    });

    // shutdownManager.register must have been called exactly once
    expect(registerMock).toHaveBeenCalledTimes(1);

    // The registered hook, when invoked, should call worker.close()
    const registeredHook = registerMock.mock.calls[0][0] as () => Promise<void>;
    expect(typeof registeredHook).toBe('function');
  });

  it('should call worker.close() when the registered shutdown hook is executed', async () => {
    const registerMock = vi.fn().mockReturnValue(ok(undefined));
    const shutdownManager = { register: registerMock } as unknown as ShutdownManager;

    createSessionWorker({
      shutdownManager,
      connection: { host: 'localhost', port: 6379 },
    });

    // Execute the registered hook
    const registeredHook = registerMock.mock.calls[0][0] as () => Promise<void>;
    await registeredHook();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should work without shutdownManager (backward compatibility)', () => {
    // Should NOT throw when shutdownManager is not provided
    const worker = createSessionWorker({
      connection: { host: 'localhost', port: 6379 },
    });

    expect(worker).toBeDefined();
    // Verify the worker has a close method from our mock
    expect(typeof worker.close).toBe('function');
  });
});
