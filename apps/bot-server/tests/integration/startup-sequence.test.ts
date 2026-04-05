import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { startApplication, type OrchestratorDeps } from '../../src/startup/orchestrator.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';

function createMockLogger() {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return logger;
}

function createFullDeps(overrides: Partial<OrchestratorDeps> = {}): OrchestratorDeps {
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
    discover: vi.fn().mockResolvedValue(
      ok({
        discovered: [
          { name: 'core-mod', path: '/m/core', config: { isCore: true } },
          { name: 'extra-mod', path: '/m/extra', config: { isCore: false } },
        ],
        skipped: [],
        failed: [],
      }),
    ),
    validate: vi.fn().mockResolvedValue(
      ok({
        validated: [
          { name: 'core-mod', path: '/m/core', config: { isCore: true } },
          { name: 'extra-mod', path: '/m/extra', config: { isCore: false } },
        ],
        skipped: [],
        failed: [],
      }),
    ),
    loadModuleHandlers: vi.fn().mockResolvedValue(ok(['core-mod', 'extra-mod'])),
    registerCommands: vi.fn().mockResolvedValue(ok(undefined)),
    createBot: vi.fn().mockReturnValue({
      start: vi.fn().mockResolvedValue(undefined),
    }),
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
    ...overrides,
  };
}

describe('startup sequence integration', () => {
  it('full startup with mocked packages — all steps execute in order', async () => {
    const callOrder: string[] = [];
    const deps = createFullDeps();

    deps.loadConfig = vi.fn(() => {
      callOrder.push('loadConfig');
      return ok({
        botToken: 'tok',
        botMode: 'polling' as const,
        port: 3000,
        superAdminIds: [],
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

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'system.startup.completed',
      expect.objectContaining({
        modulesLoaded: expect.any(Number),
        mode: 'polling',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('core module failure halts startup at correct step', async () => {
    const deps = createFullDeps({
      loadModuleHandlers: vi.fn().mockResolvedValue(
        err(
          new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED, {
            module: 'core-mod',
          }),
        ),
      ),
    });

    const result = await startApplication(deps);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED);
    // HTTP server should NOT have been created
    expect(deps.createHttpServer).not.toHaveBeenCalled();
    // Startup event should NOT have been emitted
    expect(deps.eventBus.publish).not.toHaveBeenCalledWith(
      'system.startup.completed',
      expect.anything(),
    );
  });

  it('non-core module failure continues past failure', async () => {
    // loadModuleHandlers returns ok with only core module loaded
    // (non-core skipped internally in module-loader, not orchestrator concern)
    const deps = createFullDeps({
      loadModuleHandlers: vi.fn().mockResolvedValue(ok(['core-mod'])),
    });

    const result = await startApplication(deps);

    expect(result.isOk()).toBe(true);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'system.startup.completed',
      expect.objectContaining({
        modulesLoaded: 1,
      }),
    );
  });

  it('polling mode starts bot, registers health check', async () => {
    const mockBot = { start: vi.fn().mockResolvedValue(undefined) };
    const deps = createFullDeps({
      createBot: vi.fn().mockReturnValue(mockBot),
    });

    const result = await startApplication(deps);

    expect(result.isOk()).toBe(true);
    expect(mockBot.start).toHaveBeenCalled();
    expect(deps.createHttpServer).toHaveBeenCalled();
  });

  it('webhook mode does not call bot.start', async () => {
    const mockBot = { start: vi.fn() };
    const deps = createFullDeps({
      loadConfig: vi.fn().mockReturnValue(
        ok({
          botToken: 'tok',
          botMode: 'webhook' as const,
          port: 3000,
          webhookUrl: 'https://example.com/webhook',
          webhookSecret: 'secret',
          superAdminIds: [],
        }),
      ),
      createBot: vi.fn().mockReturnValue(mockBot),
    });

    const result = await startApplication(deps);

    expect(result.isOk()).toBe(true);
    expect(mockBot.start).not.toHaveBeenCalled();
    expect(deps.createHttpServer).toHaveBeenCalled();
  });

  it('startup completes within 30 seconds', async () => {
    const deps = createFullDeps();

    const startTime = Date.now();
    const result = await startApplication(deps);
    const elapsed = Date.now() - startTime;

    expect(result.isOk()).toBe(true);
    expect(elapsed).toBeLessThan(30_000);
  });
});
