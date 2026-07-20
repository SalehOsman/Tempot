import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function createDeps(): ModuleDeps {
  return {
    logger: createLogger(),
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn().mockResolvedValue(undefined) },
    i18n: { t: (key: string) => key },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: { commands: [], features: {} } as ModuleDeps['config'],
  };
}

describe('user-management service context', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects UserService access before initialization', async () => {
    const { getUserService } = await import('../../services/user-service.context.js');

    expect(() => getUserService()).toThrow(
      '[user-management] getUserService() called before initUserService()',
    );
  }, 15_000);

  it('initializes UserService from registered module dependencies', async () => {
    const { registerDeps } = await import('../../deps.context.js');
    const { getUserService, initUserService } =
      await import('../../services/user-service.context.js');

    registerDeps(createDeps());
    initUserService();

    expect(getUserService().constructor.name).toBe('UserService');
  });
});
