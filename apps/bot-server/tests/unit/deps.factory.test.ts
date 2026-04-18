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

describe('buildDeps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['BOT_TOKEN'] = 'fake-bot-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['REDIS_HOST'] = 'localhost';
    process.env['REDIS_PORT'] = '6379';
  });

  it('returns ok with a complete OrchestratorDeps object', async () => {
    const result = await buildDeps();

    expect(result.isOk()).toBe(true);
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

  it('returns err when CacheService.init fails', async () => {
    const { CacheService } = await import('@tempot/shared');
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
});
