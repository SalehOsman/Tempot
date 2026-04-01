import { describe, it, expect } from 'vitest';
import { sessionContext } from '@tempot/shared';

describe('sessionContext', () => {
  it('should store and retrieve session in async context', () => {
    sessionContext.run({ userId: 'u1' }, () => {
      expect(sessionContext.getStore()?.userId).toBe('u1');
    });
  });

  it('should return undefined outside of context', () => {
    expect(sessionContext.getStore()).toBeUndefined();
  });

  it('should isolate contexts between concurrent async operations', async () => {
    const results: (string | undefined)[] = [];

    await Promise.all([
      new Promise<void>((resolve) => {
        sessionContext.run({ userId: 'user-A' }, async () => {
          await new Promise((r) => setTimeout(r, 10));
          results[0] = sessionContext.getStore()?.userId;
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        sessionContext.run({ userId: 'user-B' }, async () => {
          await new Promise((r) => setTimeout(r, 5));
          results[1] = sessionContext.getStore()?.userId;
          resolve();
        });
      }),
    ]);

    expect(results[0]).toBe('user-A');
    expect(results[1]).toBe('user-B');
  });

  it('should support arbitrary extra keys via index signature', () => {
    sessionContext.run({ userId: 'u2', customKey: 'customValue' }, () => {
      const store = sessionContext.getStore();
      expect(store?.customKey).toBe('customValue');
    });
  });
});
