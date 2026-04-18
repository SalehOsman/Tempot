import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import path from 'node:path';
import { ok } from 'neverthrow';
import { execSync } from 'node:child_process';

// Mock cwd to point to fixtures so discovery finds test-module
const mockCwd = path.resolve(__dirname, '__fixtures__');
vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);

import { buildDeps } from '../../src/startup/deps.factory.js';
import { startApplication } from '../../src/startup/orchestrator.js';
import type { OrchestratorDeps } from '../../src/startup/orchestrator.js';

describe('Phase 2D End-to-End Integration Tests', () => {
  let testDb: TestDB;
  let deps: OrchestratorDeps;

  beforeAll(async () => {
    process.on('uncaughtException', (err) => {
      if (err.message.includes('terminating connection due to administrator command')) {
        return; // Ignore pg disconnect error on test teardown
      }
      console.error(err);
    });

    process.env.BOT_TOKEN = '12345:testtoken';
    process.env.BOT_MODE = 'polling';
    process.env.SUPER_ADMIN_IDS = '123';
    process.env.PORT = '3000';

    // We must disable Sentry locally to avoid real network requests
    process.env.SENTRY_DSN = '';

    testDb = new TestDB();
    await testDb.start();

    // Push Prisma schema
    execSync('pnpm --filter @tempot/database exec prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('boots, loads module, processes update, and shuts down', async () => {
    // 1. Boot using buildDeps
    const depsResult = await buildDeps();
    expect(depsResult.isOk()).toBe(true);
    if (depsResult.isErr()) {
      throw new Error(
        `buildDeps failed: ${depsResult.error.code} - ${depsResult.error.details?.error}`,
      );
    }
    deps = depsResult.value;

    const publishSpy = vi.spyOn(deps.eventBus, 'publish');
    let botInstance: import('grammy').Bot<import('grammy').Context>;

    const origCreateBot = deps.createBot;
    deps.createBot = (token) => {
      botInstance = origCreateBot(token);
      botInstance.botInfo = { id: 1, is_bot: true, first_name: 'TestBot', username: 'testbot' };
      vi.spyOn(botInstance, 'start').mockResolvedValue(undefined);
      vi.spyOn(botInstance.api, 'setMyCommands').mockResolvedValue(true as never);
      return botInstance;
    };

    const origCreateHttp = deps.createHttpServer;
    deps.createHttpServer = (bot, cfg) => {
      const server = origCreateHttp(bot, cfg);
      vi.spyOn(server, 'listen').mockImplementation(() => {});
      return server;
    };

    // Grab the shutdown handler when it is registered
    const origSetupSignals = deps.setupSignalHandlers;
    deps.setupSignalHandlers = () => {
      // Actually we can intercept process.on inside origSetupSignals or just intercept ShutdownManager.execute
      return origSetupSignals();
    };
    const processOnSpy = vi.spyOn(process, 'on');

    // Bypass strict spec validation for the dummy test fixture
    deps.validate = async () => {
      const d = await deps.discover();
      if (d.isErr()) return err(d.error);
      return ok({
        validated: d.value.discovered,
        skipped: d.value.skipped,
        failed: d.value.failed,
      });
    };

    deps.registerCommands = async () => ok(undefined);

    // 2. Start application
    const startResult = await startApplication(deps);
    expect(startResult.isOk()).toBe(true);

    // Verify system.startup.completed
    expect(publishSpy).toHaveBeenCalledWith(
      'system.startup.completed',
      expect.objectContaining({
        mode: 'polling',
        modulesLoaded: 1,
      }),
    );

    // Find the shutdown handler from processOnSpy
    const sigtermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
    expect(sigtermCall).toBeDefined();
    const shutdownHandler = sigtermCall?.[1] as () => Promise<void>;

    // 3. Process mock Telegram update
    const replySpy = vi.fn();
    botInstance.api.config.use(
      (...args: Parameters<Parameters<typeof botInstance.api.config.use>[0]>) => {
        const prev = args[0];
        const method = args[1];
        const payload = args[2] as Record<string, unknown>;

        if (method === 'sendMessage') {
          replySpy(payload['chat_id'], payload['text'], payload);
          return {
            message_id: 2,
            date: Date.now() / 1000,
            chat: payload['chat_id'],
            text: payload['text'],
          };
        }
        return prev(method, args[2], args[3] as never);
      },
    );

    const mockUpdate = {
      update_id: 1,
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123, type: 'private' },
        from: { id: 123, is_bot: false, first_name: 'Test', username: 'testuser' },
        text: '/ping',
        entities: [{ offset: 0, length: 5, type: 'bot_command' }],
      },
    };

    await botInstance.handleUpdate(mockUpdate);

    // Test module should have responded with pong
    expect(replySpy).toHaveBeenCalledWith(123, 'pong', expect.any(Object));

    // 4. Trigger shutdown
    if (shutdownHandler) {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      await new Promise<void>((resolve) => {
        exitSpy.mockImplementation(() => {
          resolve();
          return undefined as never;
        });
        shutdownHandler!();
      });
      expect(exitSpy).toHaveBeenCalled();
    }

    // Verify system.shutdown.completed
    expect(publishSpy).toHaveBeenCalledWith('system.shutdown.completed', expect.any(Object));
  });
});
