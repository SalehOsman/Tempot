import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBusOrchestrator, OrchestratorConfig } from '../../src/event-bus.orchestrator.js';
import { ConnectionWatcher } from '../../src/distributed/connection.watcher.js';
import { AppError } from '@tempot/shared';
import { err } from 'neverthrow';

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
        code: 'event_bus.redis_unavailable',
        fallback: 'local',
        target: 'SUPER_ADMIN',
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

  it('should deliver locally when redis publish fails after stale availability', async () => {
    const testableOrchestrator = orchestrator as unknown as {
      watcher: ConnectionWatcher;
      redisBus: { publish: ReturnType<typeof vi.fn> };
    };
    vi.spyOn(testableOrchestrator.watcher, 'isRedisAvailable').mockReturnValue(false);

    let received = false;
    await orchestrator.subscribe('test.event.fired', () => {
      received = true;
    });

    testableOrchestrator.watcher.isRedisAvailable = vi.fn().mockReturnValue(true);
    testableOrchestrator.redisBus.publish = vi
      .fn()
      .mockResolvedValue(err(new AppError('event_bus.publish_failed')));

    const result = await orchestrator.publish('test.event.fired', {});
    expect(result.isOk()).toBe(true);
    expect(received).toBe(true);
  });

  it('should keep local subscription when redis subscribe fails after stale availability', async () => {
    const testableOrchestrator = orchestrator as unknown as {
      watcher: ConnectionWatcher;
      redisBus: { subscribe: ReturnType<typeof vi.fn> };
    };
    const availabilitySpy = vi
      .spyOn(testableOrchestrator.watcher, 'isRedisAvailable')
      .mockReturnValue(true);
    testableOrchestrator.redisBus.subscribe = vi
      .fn()
      .mockResolvedValue(err(new AppError('event_bus.subscribe_failed')));

    let received = false;
    const result = await orchestrator.subscribe('test.event.fired', () => {
      received = true;
    });
    availabilitySpy.mockReturnValue(false);

    await orchestrator.publish('test.event.fired', {});
    expect(result.isOk()).toBe(true);
    expect(received).toBe(true);
  });
});
