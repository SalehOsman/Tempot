import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBusOrchestrator, OrchestratorConfig } from '../../src/orchestrator';
import { ConnectionWatcher } from '../../src/distributed/connection.watcher';

interface MockLogger {
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
}

describe('EventBus Degradation (Rule XXXII)', () => {
  let mockLogger: MockLogger;
  let orchestrator: EventBusOrchestrator;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
    };

    orchestrator = new EventBusOrchestrator({
      redis: { connectionString: 'redis://localhost:6379' },
      logger: mockLogger as unknown as OrchestratorConfig['logger'],
    });
  });

  it('should trigger critical alert on degradation', async () => {
    // Manually trigger the status change callback for testing
    // Using a type-safe-ish cast to access private members for testing
    const testableOrchestrator = orchestrator as unknown as {
      watcher: { statusCallback: (available: boolean) => void };
    };
    testableOrchestrator.watcher.statusCallback(false);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SYSTEM_DEGRADATION',
        payload: { target: 'SUPER_ADMIN' },
      }),
    );
  });

  it('should deliver to local bus when redis is unavailable', async () => {
    const testableOrchestrator = orchestrator as unknown as {
      watcher: ConnectionWatcher;
    };
    const watcher = testableOrchestrator.watcher;
    vi.spyOn(watcher, 'isRedisAvailable').mockReturnValue(false);

    let received = false;
    await orchestrator.subscribe('test.event.fired', () => {
      received = true;
    });

    await orchestrator.publish('test.event.fired', {});
    expect(received).toBe(true);
  });
});
