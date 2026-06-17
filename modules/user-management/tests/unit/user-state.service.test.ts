import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { registerDeps } from '../../deps.context.js';
import {
  clearUserInputState,
  getUserInputState,
  setUserInputState,
} from '../../handlers/user-state.service.js';
import type { ModuleDeps } from '../../types/index.js';

function createLogger() {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger;
}

function createDeps(
  sessionResult: unknown,
): ModuleDeps & { eventBus: { publish: ReturnType<typeof vi.fn> } } {
  return {
    logger: createLogger(),
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn().mockResolvedValue(sessionResult) },
    i18n: { t: (key: string) => key },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: { commands: [], features: {} } as ModuleDeps['config'],
  };
}

describe('user input state service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('stores session-backed pending input state through the event bus', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const deps = createDeps(ok({ metadata: { existing: true } }));
    registerDeps(deps);

    await setUserInputState('123', '456', 'edit_email');

    expect(deps.eventBus.publish).toHaveBeenCalledWith('user-management.state.set', {
      telegramId: '123',
      chatId: '456',
      state: { action: 'edit_email', timestamp: 1_000 },
      metadata: {
        existing: true,
        pendingInputState: { action: 'edit_email', timestamp: 1_000 },
      },
    });
  });

  it('uses local fallback state when session loading does not return an ok result', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_000);
    registerDeps(createDeps(null));

    await setUserInputState('fallback-user', 'chat-1', 'edit_name');
    const state = await getUserInputState('fallback-user', 'chat-1');

    expect(state).toEqual({ action: 'edit_name', timestamp: 2_000 });
  });

  it('returns active session-backed state from metadata', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5_000);
    registerDeps(
      createDeps(
        ok({ metadata: { pendingInputState: { action: 'edit_role', timestamp: 4_000 } } }),
      ),
    );

    await expect(getUserInputState('123', '456')).resolves.toEqual({
      action: 'edit_role',
      timestamp: 4_000,
    });
  });

  it('clears expired session-backed state and returns null', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10 * 60 * 1_000);
    const deps = createDeps(
      ok({ metadata: { pendingInputState: { action: 'edit_role', timestamp: 1_000 } } }),
    );
    registerDeps(deps);

    await expect(getUserInputState('123', '456')).resolves.toBeNull();

    expect(deps.eventBus.publish).toHaveBeenCalledWith('user-management.state.clear', {
      telegramId: '123',
      chatId: '456',
    });
  });

  it('clears fallback state and publishes a clear event', async () => {
    const deps = createDeps(null);
    registerDeps(deps);
    await setUserInputState('clear-user', 'chat-1', 'edit_language');

    await clearUserInputState('clear-user', 'chat-1');
    await expect(getUserInputState('clear-user', 'chat-1')).resolves.toBeNull();
    expect(deps.eventBus.publish).toHaveBeenCalledWith('user-management.state.clear', {
      telegramId: 'clear-user',
      chatId: 'chat-1',
    });
  });
});
