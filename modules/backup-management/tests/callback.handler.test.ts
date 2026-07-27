import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../deps.context.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';
import type { BackupOperationsProvider, ModuleDeps } from '../index.js';

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function createContext(data: string): Context {
  return {
    from: { id: 123 },
    callbackQuery: { data, message: { message_id: 10 } },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function createOperationResult<T>(value: T) {
  return {
    success: true,
    value,
  } as const;
}

function createBackups(): BackupOperationsProvider {
  return {
    listBackups: vi.fn().mockResolvedValue(createOperationResult({ jobs: [], limit: 5 })),
    requestBackup: vi.fn().mockResolvedValue(
      createOperationResult({
        job: {
          id: 'backup-1',
          requestedBy: '123',
          requestedAt: '2026-07-27T00:00:00.000Z',
          scope: 'complete',
          sourceEnvironment: 'staging',
          status: 'succeeded',
        },
        storageReference: '/app/backups/backup-1.backup.enc',
      }),
    ),
    restoreLatest: vi.fn().mockResolvedValue(
      createOperationResult({
        id: 'restore-1',
        backupJobId: 'backup-1',
        confirmedBy: '123',
        targetClassification: 'isolated-restore',
        status: 'passed',
        requestedAt: '2026-07-27T00:00:00.000Z',
        schemaCheck: 'passed',
        dataCheck: 'passed',
        protectedDataCheck: 'passed',
        fileCoverageCheck: 'passed',
      }),
    ),
    restoreBackup: vi.fn().mockResolvedValue(
      createOperationResult({
        id: 'restore-2',
        backupJobId: 'backup-2',
        confirmedBy: '123',
        targetClassification: 'isolated-restore',
        status: 'passed',
        requestedAt: '2026-07-27T00:00:00.000Z',
        schemaCheck: 'passed',
        dataCheck: 'passed',
        protectedDataCheck: 'passed',
        fileCoverageCheck: 'passed',
      }),
    ),
    restoreProductionBackup: vi.fn().mockResolvedValue(
      createOperationResult({
        id: 'production-restore-1',
        backupJobId: 'backup-2',
        confirmedBy: '123',
        preRestoreBackupJobId: 'pre-restore-1',
        status: 'succeeded',
        requestedAt: '2026-07-27T00:00:00.000Z',
        completedAt: '2026-07-27T00:01:00.000Z',
      }),
    ),
    factoryResetDatabase: vi.fn().mockResolvedValue(
      createOperationResult({
        id: 'factory-reset-1',
        confirmedBy: '123',
        preResetBackupJobId: 'pre-reset-1',
        status: 'succeeded',
        requestedAt: '2026-07-27T00:00:00.000Z',
        completedAt: '2026-07-27T00:01:00.000Z',
      }),
    ),
  };
}

function createDeps(backups: BackupOperationsProvider = createBackups()): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) =>
        options ? `${key}:${JSON.stringify(options)}` : key,
    },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    backups,
    config: {
      name: 'backup-management',
      version: '0.1.0',
      requiredRole: 'SUPER_ADMIN',
      isActive: true,
      isCore: false,
      commands: [],
      features: {
        hasDatabase: true,
        hasNotifications: true,
        hasAttachments: true,
        hasExport: false,
        hasAI: false,
        hasInputEngine: false,
        hasImport: false,
        hasSearch: false,
        hasDynamicCMS: false,
        hasRegional: false,
      },
      requires: { packages: ['backup-engine'], optional: [] },
    },
  };
}

describe('backup-management callback handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render a confirmation action when requesting a backup', async () => {
    registerDeps(createDeps());
    const ctx = createContext('backups:request');

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'backup-management.view.request_confirm',
      expect.any(Object),
    );
    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'backups:confirm_request',
      'backups:view',
    ]);
  });

  it('should submit a backup request when confirmation is pressed', async () => {
    const backups = createBackups();
    registerDeps(createDeps(backups));
    const ctx = createContext('backups:confirm_request');

    await handleCallbackQuery(ctx);

    expect(backups.requestBackup).toHaveBeenCalledWith('123');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.request_submitted'),
      expect.any(Object),
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('/app/backups/backup-1.backup.enc'),
      expect.any(Object),
    );
  });

  it('should render a confirmation action before restore rehearsal', async () => {
    const backups = createBackups();
    backups.listBackups = vi.fn().mockResolvedValue(
      createOperationResult({
        jobs: [
          {
            id: 'backup-2',
            requestedBy: '123',
            requestedAt: '2026-07-27T02:05:00.000Z',
            scope: 'complete',
            sourceEnvironment: 'staging',
            status: 'succeeded',
          },
        ],
        limit: 5,
      }),
    );
    registerDeps(createDeps(backups));
    const ctx = createContext('backups:restore');

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.restore_select'),
      expect.any(Object),
    );
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'backups:restore_select:backup-2',
      'backups:view',
    ]);
  });

  it('should render restore confirmation for the selected backup', async () => {
    registerDeps(createDeps());
    const ctx = createContext('backups:restore_select:backup-2');

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.restore_confirm'),
      expect.any(Object),
    );
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'backups:confirm_restore:backup-2',
      'backups:view',
    ]);
  });

  it('should run restore rehearsal for the selected backup when confirmation is pressed', async () => {
    const backups = createBackups();
    registerDeps(createDeps(backups));
    const ctx = createContext('backups:confirm_restore:backup-2');

    await handleCallbackQuery(ctx);

    expect(backups.restoreBackup).toHaveBeenCalledWith('backup-2', '123');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.restore_completed'),
      expect.any(Object),
    );
    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual(['backups:pr:backup-2', 'backups:view']);
  });

  it('should require two confirmations before production restore execution', async () => {
    registerDeps(createDeps());
    const ctx = createContext('backups:pr:backup-2');

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.production_restore_warning'),
      expect.any(Object),
    );
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'backups:cpr:backup-2',
      'backups:view',
    ]);
  });

  it('should execute production restore after final confirmation', async () => {
    const backups = createBackups();
    registerDeps(createDeps(backups));
    const ctx = createContext('backups:epr:backup-2');

    await handleCallbackQuery(ctx);

    expect(backups.restoreProductionBackup).toHaveBeenCalledWith('backup-2', '123');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.production_restore_completed'),
      expect.any(Object),
    );
  });

  it('should require two confirmations before database factory reset execution', async () => {
    registerDeps(createDeps());
    const ctx = createContext('backups:factory_reset');

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.factory_reset_warning'),
      expect.any(Object),
    );
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'backups:confirm_factory_reset',
      'backups:view',
    ]);
  });

  it('should execute database factory reset after final confirmation', async () => {
    const backups = createBackups();
    registerDeps(createDeps(backups));
    const ctx = createContext('backups:execute_factory_reset');

    await handleCallbackQuery(ctx);

    expect(backups.factoryResetDatabase).toHaveBeenCalledWith('123');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('backup-management.view.factory_reset_completed'),
      expect.any(Object),
    );
  });
});
