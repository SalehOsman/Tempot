import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModuleSetupFn } from '../../src/bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';
import { loadModuleHandlers } from '../../src/startup/module-loader.js';
import type { ModuleImporter } from '../../src/startup/module-loader.js';

function createMockLogger() {
  const childLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue(childLogger),
    _child: childLogger,
  };
}

function createMockModule(
  overrides: Partial<{ name: string; isCore: boolean; path: string }> = {},
) {
  return {
    path: overrides.path ?? '/path/to/module',
    config: {
      name: overrides.name ?? 'test-module',
      isCore: overrides.isCore ?? false,
      isActive: true,
      commands: [],
      scopedUsers: undefined,
    },
  };
}

const mockBot = {} as unknown;
const mockEventBus = { publish: vi.fn().mockResolvedValue({ isOk: () => true }) };
const mockSessionProvider = { getSession: vi.fn().mockResolvedValue({}) };
const mockI18n = { t: vi.fn().mockReturnValue('translated') };
const mockSettings = { get: vi.fn().mockResolvedValue(null) };

function createDeps(importer: ModuleImporter) {
  return {
    logger: createMockLogger(),
    eventBus: mockEventBus,
    sessionProvider: mockSessionProvider,
    i18n: mockI18n,
    settings: mockSettings,
    importer,
  };
}

describe('loadModuleHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads valid module setup function successfully — returns ok with module name', async () => {
    const setupFn: ModuleSetupFn = vi.fn().mockResolvedValue(undefined);
    const importer: ModuleImporter = vi.fn().mockResolvedValue({ default: setupFn });
    const deps = createDeps(importer);
    const modules = [createMockModule({ name: 'my-module' })];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['my-module']);
    }
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it('core module failure (setup throws) returns err with CORE_MODULE_HANDLER_FAILED', async () => {
    const setupFn: ModuleSetupFn = vi.fn().mockRejectedValue(new Error('boom'));
    const importer: ModuleImporter = vi.fn().mockResolvedValue({ default: setupFn });
    const deps = createDeps(importer);
    const modules = [createMockModule({ name: 'core-mod', isCore: true })];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED);
    }
  });

  it('non-core module failure (setup throws) logs warning and continues', async () => {
    const goodSetup: ModuleSetupFn = vi.fn().mockResolvedValue(undefined);
    const badSetup: ModuleSetupFn = vi.fn().mockRejectedValue(new Error('oops'));
    const importer: ModuleImporter = vi
      .fn()
      .mockResolvedValueOnce({ default: badSetup })
      .mockResolvedValueOnce({ default: goodSetup });
    const deps = createDeps(importer);
    const modules = [
      createMockModule({ name: 'broken', isCore: false }),
      createMockModule({ name: 'working', isCore: false, path: '/path/to/working' }),
    ];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['working']);
      expect(result.value).not.toContain('broken');
    }
    expect(deps.logger._child.warn).toHaveBeenCalled();
  });

  it('core module without default export returns err with MODULE_SETUP_MISSING', async () => {
    const importer: ModuleImporter = vi.fn().mockResolvedValue({});
    const deps = createDeps(importer);
    const modules = [createMockModule({ name: 'core-no-export', isCore: true })];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.MODULE_SETUP_MISSING);
    }
  });

  it('non-core module without default export logs warning and skips', async () => {
    const goodSetup: ModuleSetupFn = vi.fn().mockResolvedValue(undefined);
    const importer: ModuleImporter = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ default: goodSetup });
    const deps = createDeps(importer);
    const modules = [
      createMockModule({ name: 'no-export', isCore: false }),
      createMockModule({ name: 'good-mod', isCore: false, path: '/path/to/good' }),
    ];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['good-mod']);
    }
    expect(deps.logger._child.warn).toHaveBeenCalled();
  });

  it('setup function receives correct ModuleDependencyContainer', async () => {
    const setupFn: ModuleSetupFn = vi.fn().mockResolvedValue(undefined);
    const importer: ModuleImporter = vi.fn().mockResolvedValue({ default: setupFn });
    const deps = createDeps(importer);
    const mod = createMockModule({ name: 'verify-deps' });
    const modules = [mod];

    await loadModuleHandlers(mockBot, modules, deps);

    expect(setupFn).toHaveBeenCalledWith(
      mockBot,
      expect.objectContaining({
        logger: deps.logger._child,
        eventBus: mockEventBus,
        sessionProvider: mockSessionProvider,
        i18n: mockI18n,
        settings: mockSettings,
        config: mod.config,
      }),
    );
  });

  it('returns list of all successfully loaded module names', async () => {
    const setupFn: ModuleSetupFn = vi.fn().mockResolvedValue(undefined);
    const importer: ModuleImporter = vi.fn().mockResolvedValue({ default: setupFn });
    const deps = createDeps(importer);
    const modules = [
      createMockModule({ name: 'alpha', path: '/a' }),
      createMockModule({ name: 'beta', path: '/b' }),
      createMockModule({ name: 'gamma', path: '/c' }),
    ];

    const result = await loadModuleHandlers(mockBot, modules, deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['alpha', 'beta', 'gamma']);
    }
    expect(setupFn).toHaveBeenCalledTimes(3);
  });

  it('returns empty array when no modules are provided', async () => {
    const importer: ModuleImporter = vi.fn();
    const deps = createDeps(importer);

    const result = await loadModuleHandlers(mockBot, [], deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
    expect(importer).not.toHaveBeenCalled();
  });
});
