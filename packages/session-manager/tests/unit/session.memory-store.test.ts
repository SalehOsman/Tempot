import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionMemoryStore } from '../../src/session.memory-store.js';
import { Session } from '../../src/session.types.js';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    userId: 'user-1',
    chatId: 'chat-1',
    role: 'USER',
    status: 'ACTIVE',
    language: 'ar',
    activeConversation: null,
    metadata: null,
    schemaVersion: 1,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SessionMemoryStore', () => {
  let store: SessionMemoryStore;

  beforeEach(() => {
    store = new SessionMemoryStore();
  });

  it('should store and retrieve a session', () => {
    const session = makeSession();
    store.set('key1', session);
    expect(store.get('key1')).toEqual(session);
  });

  it('should return undefined for non-existent key', () => {
    expect(store.get('missing')).toBeUndefined();
  });

  it('should delete a session', () => {
    store.set('key1', makeSession());
    store.del('key1');
    expect(store.get('key1')).toBeUndefined();
  });

  it('should track size', () => {
    expect(store.size).toBe(0);
    store.set('k1', makeSession());
    expect(store.size).toBe(1);
    store.set('k2', makeSession({ userId: 'user-2' }));
    expect(store.size).toBe(2);
    store.del('k1');
    expect(store.size).toBe(1);
  });

  it('should evict expired entries on get', () => {
    vi.useFakeTimers();
    const shortTtlStore = new SessionMemoryStore(100, 50);
    shortTtlStore.set('k1', makeSession());
    expect(shortTtlStore.get('k1')).toBeDefined();

    vi.advanceTimersByTime(51);
    expect(shortTtlStore.get('k1')).toBeUndefined();
    vi.useRealTimers();
  });

  it('should evict oldest entry when at capacity', () => {
    const smallStore = new SessionMemoryStore(2);
    smallStore.set('k1', makeSession({ userId: 'u1' }));
    smallStore.set('k2', makeSession({ userId: 'u2' }));
    smallStore.set('k3', makeSession({ userId: 'u3' }));

    // k1 was evicted (oldest), k2 and k3 remain
    expect(smallStore.get('k1')).toBeUndefined();
    expect(smallStore.get('k2')).toBeDefined();
    expect(smallStore.get('k3')).toBeDefined();
    expect(smallStore.size).toBe(2);
  });

  it('should overwrite existing key', () => {
    const session1 = makeSession({ version: 1 });
    const session2 = makeSession({ version: 2 });
    store.set('k1', session1);
    store.set('k1', session2);
    expect(store.get('k1')?.version).toBe(2);
    expect(store.size).toBe(1);
  });
});
