import type { Context } from 'grammy';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { statsCommand } from '../commands/stats.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

interface InlineCallbackButton {
  readonly callback_data?: string;
  readonly text: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

interface ModuleFlowSurface {
  readonly surfaceId: string;
  readonly surfaceType: string;
  readonly openedBy?: string;
  readonly visibleActions: readonly string[];
}

interface ModuleFlowCallback {
  readonly callbackData: string;
  readonly handlerStatus: string;
  readonly labelKey: string;
}

interface ModuleFlowMap {
  readonly moduleName: string;
  readonly entryPoints: readonly string[];
  readonly surfaces: readonly ModuleFlowSurface[];
  readonly callbackActions: readonly ModuleFlowCallback[];
  readonly exitPaths: readonly string[];
}

const moduleRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function createDeps(): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'audit-viewer.problems.item') {
          return `${options?.['action']}|${options?.['module']}|${options?.['traceId']}`;
        }
        if (key === 'audit-viewer.modules.summary') {
          return [
            `module:${options?.['moduleName']}`,
            `status:${options?.['status']}`,
            `commands:${options?.['commandCount']}`,
            `features:${options?.['enabledFeatureCount']}`,
            `required:${options?.['requiredPackageCount']}`,
          ].join('|');
        }
        if (key === 'audit-viewer.runtime.summary') {
          return [
            `node:${options?.['nodeVersion']}`,
            `pid:${options?.['pid']}`,
            `uptime:${options?.['uptimeSeconds']}`,
            `rss:${options?.['rssMb']}`,
          ].join('|');
        }
        if (key === 'audit-viewer.status.active') return 'active';
        if (key === 'audit-viewer.status.inactive') return 'inactive';
        return key;
      },
    },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    auditLog: { findMany: vi.fn().mockResolvedValue([]) },
    interactionEvents: { findMany: vi.fn().mockResolvedValue([]) },
    config: createConfig('audit-viewer'),
  };
}

function createConfig(name: string): ModuleDeps['config'] {
  return {
    name,
    version: '0.1.0',
    requiredRole: 'ADMIN',
    isActive: true,
    isCore: false,
    commands: [],
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
    requires: { packages: [], optional: [] },
  };
}

async function readFlowMap(): Promise<ModuleFlowMap> {
  const rawFlowMap = await readFile(join(moduleRoot, 'module.flow.json'), 'utf8');
  return JSON.parse(rawFlowMap) as ModuleFlowMap;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function buttonTextFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) => row.map((button) => button.text));
}

describe('audit-viewer runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers stats command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('stats', statsCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('documents visible stats callbacks in the governed module flow map', async () => {
    const flowMap = await readFlowMap();
    const callbackActions = new Set(
      flowMap.callbackActions.map((callback) => callback.callbackData),
    );
    const surfaceActions = flowMap.surfaces.flatMap((surface) => surface.visibleActions);

    expect(flowMap.moduleName).toBe('audit-viewer');
    expect(flowMap.entryPoints).toContain('stats');
    expect(flowMap.exitPaths).toContain('menu:main');
    expect(surfaceActions).toEqual(
      expect.arrayContaining([
        'stats:modules',
        'stats:runtime',
        'stats:problems',
        'stats:timeline',
        'stats:view',
        'menu:main',
      ]),
    );
    expect(callbackActions).toEqual(
      new Set(['stats:view', 'stats:modules', 'stats:runtime', 'stats:problems', 'stats:timeline']),
    );
  });

  it('documents audit-viewer leaf surfaces without repeated self-navigation', async () => {
    const flowMap = await readFlowMap();
    const leafSurfaces = flowMap.surfaces.filter((surface) => surface.surfaceType === 'leaf');

    expect(leafSurfaces).toHaveLength(4);
    for (const surface of leafSurfaces) {
      expect(surface.openedBy).toBeDefined();
      expect(surface.visibleActions).not.toContain(surface.openedBy);
      expect(surface.visibleActions).toContain('stats:view');
      expect(surface.visibleActions).toContain('menu:main');
    }
  });

  it('shows operational statistics from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await statsCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('audit-viewer.view.title', expect.any(Object));
  });

  it('shows recent interaction problems from callback', async () => {
    const deps = createDeps();
    deps.auditLog.findMany = vi.fn().mockResolvedValue([
      {
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        timestamp: new Date('2026-05-22T01:00:00.000Z'),
        after: { callbackData: 'settings:open' },
      },
    ]);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'stats:problems', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('settings:open|settings-management|trace-1'),
      expect.any(Object),
    );
  });

  it('shows module statistics from live module configuration', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'stats:modules', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('module:audit-viewer|status:active|commands:0|features:0|required:0'),
      expect.any(Object),
    );
  });

  it('shows runtime statistics from the active Node process', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'stats:runtime', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining(`node:${process.version}|pid:${process.pid}`),
      expect.any(Object),
    );
  });

  it('renders every statistics detail page as a leaf without repeating the selected callback action', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const detailCallbacks = [
      'stats:modules',
      'stats:runtime',
      'stats:problems',
      'stats:timeline',
    ] as const;

    for (const selectedCallback of detailCallbacks) {
      const ctx = {
        callbackQuery: { data: selectedCallback, message: { message_id: 10 } },
        answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
        editMessageText: vi.fn().mockResolvedValue(undefined),
        reply: vi.fn().mockResolvedValue(undefined),
      } as unknown as Context;

      await handleCallbackQuery(ctx);

      const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
      const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
      const callbacks = callbackDataFrom(options.reply_markup);
      const labels = buttonTextFrom(options.reply_markup);
      expect(callbacks).toContain('stats:view');
      expect(callbacks).toContain('menu:main');
      expect(callbacks).not.toContain(selectedCallback);
      expect(labels).toContain('audit-viewer.menu.stats_back');
      expect(labels).not.toContain('audit-viewer.menu.button');
    }
  });

  it('treats unchanged statistics page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'stats:view', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
