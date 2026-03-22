import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBusOrchestrator } from '../../src/orchestrator';

describe('EventBus Degradation (Rule XXXII)', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockLogger: any;
  let orchestrator: EventBusOrchestrator;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
    };

    orchestrator = new EventBusOrchestrator({
      redis: { connectionString: 'redis://localhost:6379' },
      logger: mockLogger,
    });
  });

  it('should trigger critical alert on degradation', async () => {
    // Manually trigger the status change callback for testing
    const watcher = (orchestrator as any).watcher;
    watcher.statusCallback(false);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SYSTEM_DEGRADATION',
        payload: { target: 'SUPER_ADMIN' },
      }),
    );
  });

  it('should deliver to local bus when redis is unavailable', async () => {
    const watcher = (orchestrator as any).watcher;
    vi.spyOn(watcher, 'isRedisAvailable').mockReturnValue(false);

    let received = false;
    await orchestrator.subscribe('test.event.fired', () => {
      received = true;
    });

    await orchestrator.publish('test.event.fired', {});
    expect(received).toBe(true);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
});
