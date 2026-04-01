import { describe, it, expect } from 'vitest';
import { LocalEventBus } from '../../src/local/local.bus.js';

describe('Performance', () => {
  const validEventName = 'module.entity.action';
  const testPayload = { key: 'value' };

  it('LocalEventBus.publish() with no listeners (SC-001: < 1ms)', async () => {
    const bus = new LocalEventBus();
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await bus.publish(validEventName, testPayload);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('LocalEventBus.publish() with 1 listener (SC-001: < 1ms)', async () => {
    const bus = new LocalEventBus();
    bus.subscribe(validEventName, () => {});
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await bus.publish(validEventName, testPayload);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('LocalEventBus.publish() with 10 listeners (SC-001: < 1ms)', async () => {
    const bus = new LocalEventBus();
    for (let j = 0; j < 10; j++) {
      bus.subscribe(validEventName, () => {});
    }
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await bus.publish(validEventName, testPayload);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('LocalEventBus.subscribe() registration (SC-001: < 1ms)', () => {
    const bus = new LocalEventBus();
    const handler = () => {};
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      bus.subscribe(`module.entity.action${i}`, handler);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });
});
