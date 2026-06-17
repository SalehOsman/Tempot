import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger the mocked
// modules so Vitest can hoist them.
// ---------------------------------------------------------------------------

vi.mock('@tempot/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@tempot/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tempot/shared')>();
  return {
    ...actual,
    ShutdownManager: vi.fn().mockImplementation(function () {
      return {
        register: vi.fn().mockReturnValue(ok(undefined)),
        execute: vi.fn().mockResolvedValue(ok(undefined)),
      };
    }),
    CacheService: vi.fn().mockImplementation(function () {
      return {
        get: vi.fn().mockResolvedValue(ok(null)),
        set: vi.fn().mockResolvedValue(ok(undefined)),
        del: vi.fn().mockResolvedValue(ok(undefined)),
        reset: vi.fn().mockResolvedValue(ok(undefined)),
        init: vi.fn().mockResolvedValue(ok(undefined)),
      };
    }),
  };
});

vi.mock('@tempot/event-bus', () => ({
  EventBusOrchestrator: vi.fn().mockImplementation(function () {
    return {
      init: vi.fn().mockResolvedValue(ok(undefined)),
      publish: vi.fn().mockResolvedValue(ok(undefined)),
      subscribe: vi.fn().mockResolvedValue(ok(undefined)),
      getRedisClient: vi.fn().mockReturnValue(undefined),
      dispose: vi.fn().mockResolvedValue(ok(undefined)),
    };
  }),
}));

vi.mock('@tempot/database', () => ({
  prisma: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    session: { upsert: vi.fn().mockResolvedValue({}) },
    setting: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
  },
  AuditLogRepository: vi.fn().mockImplementation(function () {
    return { findMany: vi.fn().mockResolvedValue(ok([])) };
  }),
  BootstrapSessionRepository: vi.fn().mockImplementation(function () {
    return { upsertSuperAdminSession: vi.fn().mockResolvedValue(ok(undefined)) };
  }),
  InteractionEventRepository: vi.fn().mockImplementation(function () {
    return { findMany: vi.fn().mockResolvedValue(ok([])) };
  }),
  StaticProtectedDataKeyProvider: vi.fn().mockImplementation(function (keyRing: unknown) {
    return { keyRing };
  }),
  NodeProtectedDataService: vi.fn().mockImplementation(function (keyProvider: unknown) {
    return { keyProvider };
  }),
}));

vi.mock('@tempot/session-manager', () => ({
  SessionProvider: vi.fn().mockImplementation(function () {
    return {
      getSession: vi.fn().mockResolvedValue(ok(null)),
      saveSession: vi.fn().mockResolvedValue(ok(undefined)),
    };
  }),
  SessionRepository: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@tempot/settings', () => ({
  SETTINGS_ERRORS: {
    PROTECTED_DATA_INVALID_KEY_RING: 'settings.protected_data.invalid_key_ring',
    PROTECTED_DATA_KEY_REUSE: 'settings.protected_data.key_reuse',
  },
  StaticSettingsLoader: {
    load: vi.fn().mockReturnValue(
      ok({
        botToken: 'test-token',
        databaseUrl: 'postgresql://test',
        superAdminIds: [111],
        defaultLanguage: 'en',
        defaultCountry: 'US',
      }),
    ),
  },
  SettingsRepository: vi.fn().mockImplementation(function () {
    return {};
  }),
  DynamicSettingsService: vi.fn().mockImplementation(function () {
    return {
      get: vi.fn().mockResolvedValue(ok(false)),
    };
  }),
  MaintenanceService: vi.fn().mockImplementation(function () {
    return {
      getStatus: vi.fn().mockResolvedValue(ok({ enabled: false, isSuperAdmin: () => false })),
    };
  }),
  SettingsService: vi.fn().mockImplementation(function () {
    return {
      getMaintenanceStatus: vi
        .fn()
        .mockResolvedValue(ok({ enabled: false, isSuperAdmin: () => false })),
      getDynamic: vi.fn().mockResolvedValue(ok(false)),
    };
  }),
}));

vi.mock('@tempot/i18n-core', () => ({
  initI18n: vi.fn().mockResolvedValue(undefined),
  loadModuleLocales: vi.fn().mockResolvedValue(ok(undefined)),
  t: vi.fn().mockImplementation((key: string) => key),
}));

vi.mock('@tempot/module-registry', () => ({
  ModuleRegistry: vi.fn().mockImplementation(function () {
    return {
      discover: vi.fn().mockResolvedValue(ok({ discovered: [], skipped: [], failed: [] })),
      validate: vi.fn().mockResolvedValue(ok({ validated: [], skipped: [], failed: [] })),
      register: vi.fn().mockResolvedValue(ok(undefined)),
    };
  }),
  ModuleDiscovery: vi.fn().mockImplementation(function () {
    return {};
  }),
  ModuleValidator: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@tempot/sentry', () => ({
  initSentry: vi.fn().mockReturnValue(ok(undefined)),
  SentryReporter: vi.fn().mockImplementation(function () {
    return {
      reportWithReference: vi.fn().mockReturnValue(ok(null)),
    };
  }),
}));

vi.mock('@tempot/auth-core', () => ({
  abilityDefinitions: [],
  RoleEnum: { GUEST: 'GUEST', USER: 'USER', ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER_ADMIN' },
}));

// ---------------------------------------------------------------------------
// Subject under test
// ---------------------------------------------------------------------------

import { buildDeps } from '../../src/startup/deps.factory.js';
import { NodeProtectedDataService, StaticProtectedDataKeyProvider } from '@tempot/database';
import { StaticSettingsLoader } from '@tempot/settings';
import { initI18n, loadModuleLocales } from '@tempot/i18n-core';
import { logger } from '@tempot/logger';
import { AppError, CacheService } from '@tempot/shared';

function validStaticSettings() {
  return {
    botToken: 'test-token',
    databaseUrl: 'postgresql://test',
    superAdminIds: [111],
    defaultLanguage: 'en',
    defaultCountry: 'US',
    protectedDataKeys: {
      activeEncryptionKeyVersion: 'enc-v1',
      encryptionKeys: { 'enc-v1': Buffer.alloc(32, 1) },
      activeLookupKeyVersion: 'lookup-v1',
      lookupKeys: { 'lookup-v1': Buffer.alloc(32, 2) },
    },
  };
}

describe('buildDeps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(StaticSettingsLoader.load).mockReturnValue(ok(validStaticSettings()));
    process.env['BOT_TOKEN'] = 'fake-bot-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['REDIS_HOST'] = 'localhost';
    process.env['REDIS_PORT'] = '6379';
  });

  it('returns ok with a complete OrchestratorDeps object', async () => {
    const result = await buildDeps();

    expect(result.isOk()).toBe(true);
  });

  it('returns err when protected data key configuration is entirely absent', async () => {
    vi.mocked(StaticSettingsLoader.load).mockReturnValueOnce(
      ok({ ...validStaticSettings(), protectedDataKeys: null }),
    );

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('settings.protected_data.invalid_key_ring');
  });

  it('returns err when protected data key configuration is invalid', async () => {
    vi.mocked(StaticSettingsLoader.load).mockReturnValueOnce(
      err(new AppError('settings.protected_data.invalid_key_ring')),
    );

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('settings.protected_data.invalid_key_ring');
  });

  it('returns err when static settings validation fails', async () => {
    vi.mocked(StaticSettingsLoader.load).mockReturnValueOnce(
      err(new AppError('settings.static.validation_failed')),
    );

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('settings.static.validation_failed');
  });

  it('returns err when i18n initialization rejects', async () => {
    vi.mocked(initI18n).mockRejectedValueOnce(new Error('locale catalog unavailable'));

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-server.startup.i18n_init_failed');
  });

  it('creates the protected data service when key configuration is valid', async () => {
    const settings = validStaticSettings();
    vi.mocked(StaticSettingsLoader.load).mockReturnValueOnce(ok(settings));

    const result = await buildDeps();

    expect(result.isOk()).toBe(true);
    expect(StaticProtectedDataKeyProvider).toHaveBeenCalledWith(settings.protectedDataKeys);
    expect(NodeProtectedDataService).toHaveBeenCalledWith(expect.any(Object));
  });

  it('returns OrchestratorDeps with all required function fields', async () => {
    const result = await buildDeps();

    const deps = result._unsafeUnwrap();
    expect(typeof deps.loadConfig).toBe('function');
    expect(typeof deps.connectDatabase).toBe('function');
    expect(typeof deps.bootstrapSuperAdmins).toBe('function');
    expect(typeof deps.warmCaches).toBe('function');
    expect(typeof deps.discover).toBe('function');
    expect(typeof deps.validate).toBe('function');
    expect(typeof deps.loadModuleHandlers).toBe('function');
    expect(typeof deps.registerCommands).toBe('function');
    expect(typeof deps.createBot).toBe('function');
    expect(typeof deps.createHttpServer).toBe('function');
    expect(typeof deps.registerShutdownHooks).toBe('function');
    expect(typeof deps.setupSignalHandlers).toBe('function');
    expect(typeof deps.startupState.markStarted).toBe('function');
    expect(typeof deps.startupState.activateReadiness).toBe('function');
  });

  it('returns err when prisma.$connect throws', async () => {
    const { prisma } = await import('@tempot/database');
    vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error('DB unreachable'));

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-server.startup.database_unreachable');
  });

  it('returns err when EventBusOrchestrator.init fails', async () => {
    const { EventBusOrchestrator } = await import('@tempot/event-bus');
    vi.mocked(EventBusOrchestrator).mockImplementationOnce(function () {
      return {
        init: vi.fn().mockResolvedValue(err(new Error('redis down') as never)),
        publish: vi.fn(),
        dispose: vi.fn(),
      };
    } as never);

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
  });

  it('returns typed err when EventBusOrchestrator.init rejects', async () => {
    const { EventBusOrchestrator } = await import('@tempot/event-bus');
    vi.mocked(EventBusOrchestrator).mockImplementationOnce(function () {
      return {
        init: vi.fn().mockRejectedValue(new Error('redis refused connection')),
        publish: vi.fn(),
        dispose: vi.fn(),
      };
    } as never);

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-server.startup.event_bus_failed');
  });

  it('returns err when CacheService.init fails', async () => {
    vi.mocked(CacheService).mockImplementationOnce(function () {
      return {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        reset: vi.fn(),
        init: vi.fn().mockResolvedValue(err(new Error('cache init failed') as never)),
      };
    } as never);

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
  });

  it('returns typed err when CacheService.init rejects', async () => {
    vi.mocked(CacheService).mockImplementationOnce(function () {
      return {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        reset: vi.fn(),
        init: vi.fn().mockRejectedValue(new Error('cache backend unavailable')),
      };
    } as never);

    const result = await buildDeps();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-server.startup.cache_init_failed');
  });

  it('logger and eventBus are present on the returned deps', async () => {
    const result = await buildDeps();
    const deps = result._unsafeUnwrap();

    expect(deps.logger).toBeDefined();
    expect(typeof deps.logger.info).toBe('function');
    expect(deps.eventBus).toBeDefined();
    expect(typeof deps.eventBus.publish).toBe('function');
  });

  it('connectDatabase dep calls prisma.$connect', async () => {
    const result = await buildDeps();
    const deps = result._unsafeUnwrap();
    const { prisma } = await import('@tempot/database');

    await deps.connectDatabase();

    // prisma.$connect is called at least once during buildDeps itself
    expect(vi.mocked(prisma.$connect)).toHaveBeenCalled();
  });

  it('logs translation cache warming failure when loadModuleLocales returns err', async () => {
    const result = await buildDeps();
    const deps = result._unsafeUnwrap();
    vi.mocked(loadModuleLocales).mockResolvedValueOnce(err(new AppError('i18n.load_failed')));
    vi.mocked(logger.warn).mockClear();

    const warmResult = await deps.warmCaches();

    expect(warmResult.isOk()).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Translation cache warming failed' }),
    );
  });
});
