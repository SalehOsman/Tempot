import { describe, it, expect, vi } from 'vitest';
import type { ModuleEventBus } from '../../src/bot-server.types.js';

function createMockEventBus(): ModuleEventBus {
  return {
    publish: vi.fn().mockResolvedValue({ isOk: () => true }),
  };
}

describe('system lifecycle events', () => {
  it('system.startup.completed has correct payload shape', async () => {
    const eventBus = createMockEventBus();

    const payload = {
      durationMs: 1234,
      modulesLoaded: 5,
      mode: 'polling',
    };

    await eventBus.publish('system.startup.completed', payload);

    expect(eventBus.publish).toHaveBeenCalledWith('system.startup.completed', {
      durationMs: 1234,
      modulesLoaded: 5,
      mode: 'polling',
    });
  });

  it('system.shutdown.initiated has reason in payload', async () => {
    const eventBus = createMockEventBus();

    const payload = { reason: 'SIGTERM' };

    await eventBus.publish('system.shutdown.initiated', payload);

    expect(eventBus.publish).toHaveBeenCalledWith('system.shutdown.initiated', {
      reason: 'SIGTERM',
    });
  });

  it('system.shutdown.completed has durationMs in payload', async () => {
    const eventBus = createMockEventBus();

    const payload = { durationMs: 2500 };

    await eventBus.publish('system.shutdown.completed', payload);

    expect(eventBus.publish).toHaveBeenCalledWith('system.shutdown.completed', {
      durationMs: 2500,
    });
  });

  it('system.error has referenceCode and errorCode in payload', async () => {
    const eventBus = createMockEventBus();

    const payload = {
      referenceCode: 'ERR-20260405-0001',
      errorCode: 'bot-server.module.handler_failed',
      module: 'cms-engine',
    };

    await eventBus.publish('system.error', payload);

    expect(eventBus.publish).toHaveBeenCalledWith('system.error', {
      referenceCode: 'ERR-20260405-0001',
      errorCode: 'bot-server.module.handler_failed',
      module: 'cms-engine',
    });
  });
});
