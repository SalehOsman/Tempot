import { describe, expect, it } from 'vitest';
import { createStartupStateStore } from '../../src/startup/startup-state.js';

describe('startup state store', () => {
  it('starts with readiness inactive and every stage pending', () => {
    const store = createStartupStateStore(['config', 'httpServer']);

    const snapshot = store.snapshot();

    expect(snapshot.ready).toBe(false);
    expect(snapshot.stages).toEqual([
      expect.objectContaining({ name: 'config', required: true, status: 'pending' }),
      expect.objectContaining({ name: 'httpServer', required: true, status: 'pending' }),
    ]);
  });

  it('tracks stage lifecycle and readiness activation', () => {
    const store = createStartupStateStore(['httpServer']);

    store.markStarted('httpServer');
    store.markReady('httpServer');
    store.activateReadiness();

    expect(store.snapshot()).toEqual({
      ready: true,
      stages: [
        expect.objectContaining({
          name: 'httpServer',
          status: 'ready',
          errorCode: undefined,
        }),
      ],
    });
  });

  it('records failures and deactivates readiness', () => {
    const store = createStartupStateStore(['httpServer']);

    store.activateReadiness();
    store.markFailed('httpServer', 'bot-server.startup.http_server_failed');

    const snapshot = store.snapshot();

    expect(snapshot.ready).toBe(false);
    expect(snapshot.stages).toEqual([
      expect.objectContaining({
        name: 'httpServer',
        status: 'failed',
        errorCode: 'bot-server.startup.http_server_failed',
      }),
    ]);
  });

  it('keeps optional degraded stages explicit without deactivating readiness', () => {
    const store = createStartupStateStore(['cache', 'httpServer']);

    store.markReady('httpServer');
    store.activateReadiness();
    store.markDegraded('cache', 'bot-server.startup.cache_warming_failed');

    const snapshot = store.snapshot();

    expect(snapshot.ready).toBe(true);
    expect(snapshot.stages).toEqual([
      expect.objectContaining({
        name: 'cache',
        required: false,
        status: 'degraded',
        errorCode: 'bot-server.startup.cache_warming_failed',
      }),
      expect.objectContaining({ name: 'httpServer', required: true, status: 'ready' }),
    ]);
  });
});
