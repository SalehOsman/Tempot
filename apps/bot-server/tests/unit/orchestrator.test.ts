import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { ValidatedModule, ModuleConfig } from '@tempot/module-registry';
import { startApplication, type OrchestratorDeps } from '../../src/startup/orchestrator.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

function createMockDeps(): OrchestratorDeps {
  const logger = createMockLogger();
  return {
    loadConfig: vi.fn().mockReturnValue(
      ok({
        botToken: 'test-token',
        botMode: 'polling' as const,
        port: 3000,
        superAdminIds: [111],
      }),
    ),
    connectDatabase: vi.fn().mockResolvedValue(ok(undefined)),
    bootstrapSuperAdmins: vi.fn().mockResolvedValue(ok(undefined)),
    warmCaches: vi.fn().mockResolvedValue(ok(undefined)),
    discover: vi.fn().mockResolvedValue(ok({ discovered: [], skipped: [], failed: [] })),
    validate: vi.fn().mockResolvedValue(ok({ validated: [], skipped: [], failed: [] })),
    loadModuleHandlers: vi.fn().mockResolvedValue(ok([])),
    registerCommands: vi.fn().mockResolvedValue(ok(undefined)),
    createBot: vi.fn().mockReturnValue({ start: vi.fn().mockResolvedValue(undefined) }),
    createHttpServer: vi.fn().mockReturnValue({
      listen: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    registerShutdownHooks: vi.fn().mockReturnValue(ok(undefined)),
    setupSignalHandlers: vi.fn().mockReturnValue(ok(undefined)),
    eventBus: {
      publish: vi.fn().mockResolvedValue({ isOk: () => true }),
    },
    logger,
  };
}

describe('startApplication', () => {
  let deps: OrchestratorDeps;

  beforeEach(() => {
    deps = createMockDeps();
  });

  it('calls all startup steps in correct order', async () => {
    const callOrder: string[] = [];

    deps.loadConfig = vi.fn(() => {
      callOrder.push('loadConfig');
      return ok({
        botToken: 'test-token',
        botMode: 'polling' as const,
        port: 3000,
        superAdminIds: [111],
      });
    });
    deps.connectDatabase = vi.fn(async () => {
      callOrder.push('connectDatabase');
      return ok(undefined);
    });
    deps.bootstrapSuperAdmins = vi.fn(async () => {
      callOrder.push('bootstrapSuperAdmins');
      return ok(undefined);
    });
    deps.warmCaches = vi.fn(async () => {
      callOrder.push('warmCaches');
      return ok(undefined);
    });
    deps.discover = vi.fn(async () => {
      callOrder.push('discover');
      return ok({ discovered: [], skipped: [], failed: [] });
    });
    deps.validate = vi.fn(async () => {
      callOrder.push('validate');
      return ok({ validated: [], skipped: [], failed: [] });
    });
    deps.loadModuleHandlers = vi.fn(async () => {
      callOrder.push('loadModuleHandlers');
      return ok([]);
    });
    deps.registerCommands = vi.fn(async () => {
      callOrder.push('registerCommands');
      return ok(undefined);
    });

    const result = await startApplication(deps);

    expect(result.isOk()).toBe(true);
    expect(callOrder).toEqual([
      'loadConfig',
      'connectDatabase',
      'bootstrapSuperAdmins',
      'warmCaches',
      'discover',
      'validate',
      'loadModuleHandlers',
      'registerCommands',
    ]);
  });

  it('returns fatal error on missing config', async () => {
    deps.loadConfig = vi
      .fn()
      .mockReturnValue(err(new AppError(BOT_SERVER_ERRORS.MISSING_BOT_TOKEN)));

    const result = await startApplication(deps);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BOT_SERVER_ERRORS.MISSING_BOT_TOKEN);
    expect(deps.connectDatabase).not.toHaveBeenCalled();
  });

  it('returns fatal error on database unreachable', async () => {
    deps.connectDatabase = vi
      .fn()
      .mockResolvedValue(err(new AppError(BOT_SERVER_ERRORS.DATABASE_UNREACHABLE)));

    const result = await startApplication(deps);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BOT_SERVER_ERRORS.DATABASE_UNREACHABLE);
    expect(deps.bootstrapSuperAdmins).not.toHaveBeenCalled();
  });

  it('returns fatal error on core module validation failure', async () => {
    deps.validate = vi
      .fn()
      .mockResolvedValue(err(new AppError('module-registry.validation_failed')));

    const result = await startApplication(deps);

    expect(result.isErr()).toBe(true);
    expect(deps.loadModuleHandlers).not.toHaveBeenCalled();
  });

  it('returns fatal error on core module handler failure', async () => {
    deps.loadModuleHandlers = vi
      .fn()
      .mockResolvedValue(err(new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED)));

    const result = await startApplication(deps);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED);
  });

  it('logs warning and continues when cache warming returns err (W5)', async () => {
    deps.warmCaches = vi
      .fn()
      .mockResolvedValue(err(new AppError(BOT_SERVER_ERRORS.CACHE_WARMING_FAILED)));

    const result = await startApplication(deps);

    expect(result.isOk()).toBe(true);
    expect(deps.discover).toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'cache_warming_failed',
        error: BOT_SERVER_ERRORS.CACHE_WARMING_FAILED,
      }),
    );
    // Must NOT log success when warming failed
    expect(deps.logger.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'caches_warmed' }),
    );
  });

  it('logs caches_warmed only when cache warming succeeds (W5)', async () => {
    deps.warmCaches = vi.fn().mockResolvedValue(ok(undefined));

    await startApplication(deps);

    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'caches_warmed' }),
    );
    expect(deps.logger.warn).not.toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'cache_warming_failed' }),
    );
  });

  it('emits system.startup.completed with durationMs, modulesLoaded, mode', async () => {
    deps.loadModuleHandlers = vi.fn().mockResolvedValue(ok(['core-module', 'extra-module']));

    await startApplication(deps);

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'system.startup.completed',
      expect.objectContaining({
        modulesLoaded: 2,
        mode: 'polling',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('starts polling in polling mode', async () => {
    const mockBot = { start: vi.fn().mockResolvedValue(undefined) };
    deps.createBot = vi.fn().mockReturnValue(mockBot);

    await startApplication(deps);

    expect(mockBot.start).toHaveBeenCalled();
  });

  it('does not call bot.start in webhook mode', async () => {
    deps.loadConfig = vi.fn().mockReturnValue(
      ok({
        botToken: 'test-token',
        botMode: 'webhook' as const,
        port: 3000,
        webhookUrl: 'https://example.com/webhook',
        webhookSecret: 'secret',
        superAdminIds: [],
      }),
    );
    const mockBot = { start: vi.fn() };
    deps.createBot = vi.fn().mockReturnValue(mockBot);

    await startApplication(deps);

    expect(mockBot.start).not.toHaveBeenCalled();
  });

  it('passes ValidatedModule[] to loadModuleHandlers, not unknown[] (W7)', async () => {
    const mockConfig: ModuleConfig = {
      name: 'test-module',
      version: '1.0.0',
      requiredRole: 'USER',
      commands: [{ command: 'test', description: 'Test command' }],
      features: {
        hasDatabase: false,
        hasNotifications: false,
        hasAttachments: false,
        hasExport: false,
        hasAI: false,
        hasInputEngine: false,
        hasImport: false,
        hasSearch: false,
        hasDynamicCMS: false,
        hasRegional: false,
      },
      isActive: true,
      isCore: true,
      requires: { packages: [], optional: [] },
    };

    const validatedModules: ValidatedModule[] = [
      {
        name: 'test-module',
        path: '/modules/test',
        config: mockConfig,
        validatedAt: new Date(),
      },
    ];

    deps.validate = vi
      .fn()
      .mockResolvedValue(ok({ validated: validatedModules, skipped: [], failed: [] }));

    await startApplication(deps);

    expect(deps.loadModuleHandlers).toHaveBeenCalledWith(expect.anything(), validatedModules);
  });

  it('passes BotLike to loadModuleHandlers and createHttpServer, not unknown (W7)', async () => {
    const mockBot = { start: vi.fn().mockResolvedValue(undefined) };
    deps.createBot = vi.fn().mockReturnValue(mockBot);

    await startApplication(deps);

    expect(deps.loadModuleHandlers).toHaveBeenCalledWith(mockBot, expect.anything());
    expect(deps.createHttpServer).toHaveBeenCalledWith(mockBot, expect.anything());
  });
});
