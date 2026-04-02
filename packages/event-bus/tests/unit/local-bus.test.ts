import { describe, it, expect, vi } from 'vitest';
import { LocalEventBus } from '../../src/local/local.bus.js';
import type { TempotEvents } from '../../src/event-bus.events.js';
import { AppError } from '@tempot/shared';

describe('LocalEventBus', () => {
  it('should publish and subscribe to events', async () => {
    const bus = new LocalEventBus();
    const handler = vi.fn();
    const eventName = 'test.entity.action';
    const payload = { data: 'test' };

    bus.subscribe(eventName, handler);
    const result = await bus.publish(eventName, payload);

    expect(result.isOk()).toBe(true);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('should support multiple subscribers for the same event', async () => {
    const bus = new LocalEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const eventName = 'test.entity.action';
    const payload = { data: 'test' };

    bus.subscribe(eventName, handler1);
    bus.subscribe(eventName, handler2);
    await bus.publish(eventName, payload);

    expect(handler1).toHaveBeenCalledWith(payload);
    expect(handler2).toHaveBeenCalledWith(payload);
  });

  it('should ensure listener isolation (one listener crash does not stop others)', async () => {
    const bus = new LocalEventBus();
    const handler1 = vi.fn().mockImplementation(() => {
      throw new Error('Crashed');
    });
    const handler2 = vi.fn();
    const eventName = 'test.entity.action';
    const payload = { data: 'test' };

    bus.subscribe(eventName, handler1);
    bus.subscribe(eventName, handler2);

    const result = await bus.publish(eventName, payload);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    expect(result.isOk()).toBe(true);
  });

  it('should validate event name on publish', async () => {
    const bus = new LocalEventBus();
    const eventName = 'invalid-name';
    const payload = { data: 'test' };

    const result = await bus.publish(eventName, payload);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect((result.error as AppError).code).toBe('event_bus.invalid_name');
    }
  });

  it('should return err on invalid event name in subscribe', () => {
    const bus = new LocalEventBus();
    const eventName = 'invalid-name';
    const handler = vi.fn();

    const result = bus.subscribe(eventName, handler);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('event_bus.invalid_name');
    }
  });

  it('should enforce typed payloads for registered TempotEvents', async () => {
    const bus = new LocalEventBus();
    const handler = vi.fn<(payload: TempotEvents['storage.file.uploaded']) => void>();

    const payload: TempotEvents['storage.file.uploaded'] = {
      attachmentId: 'att-1',
      fileName: 'generated.png',
      originalName: 'photo.png',
      mimeType: 'image/png',
      size: 1024,
      provider: 'local',
      moduleId: 'mod-1',
      entityId: 'ent-1',
      uploadedBy: 'user-1',
    };

    bus.subscribe('storage.file.uploaded', handler);
    const result = await bus.publish('storage.file.uploaded', payload);

    expect(result.isOk()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(payload);
    expect(handler.mock.calls[0]?.[0]?.attachmentId).toBe('att-1');
  });

  it('should allow unknown payload for unregistered event names', async () => {
    const bus = new LocalEventBus();
    const handler = vi.fn();
    const payload = { custom: 'data' };

    bus.subscribe('custom.entity.action', handler);
    const result = await bus.publish('custom.entity.action', payload);

    expect(result.isOk()).toBe(true);
    expect(handler).toHaveBeenCalledWith(payload);
  });
});
