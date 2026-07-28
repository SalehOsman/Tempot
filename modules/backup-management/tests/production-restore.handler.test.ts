import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../deps.context.js';
import {
  executeProductionRestoreView,
  productionRestoreFinalConfirmView,
  productionRestoreWarningView,
} from '../handlers/production-restore.handler.js';
import type { BackupOperationsProvider, ModuleDeps } from '../index.js';

function createContext(fromId?: number): Context {
  return {
    from: fromId === undefined ? undefined : { id: fromId },
  } as unknown as Context;
}

function createBackups(): BackupOperationsProvider {
  return {
    listBackups: vi.fn(),
    requestBackup: vi.fn(),
    restoreLatest: vi.fn(),
    restoreBackup: vi.fn(),
    restoreProductionBackup: vi.fn().mockResolvedValue({
      success: true,
      value: {
        id: 'production-restore-1',
        backupJobId: 'backup-2',
        confirmedBy: '123',
        preRestoreBackupJobId: 'pre-restore-1',
        status: 'succeeded',
        requestedAt: '2026-07-27T00:00:00.000Z',
        completedAt: '2026-07-27T00:01:00.000Z',
      },
    }),
    factoryResetDatabase: vi.fn(),
  };
}

function createDeps(backups?: BackupOperationsProvider): ModuleDeps {
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

describe('production restore handler views', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render production restore warning views for selected backups', () => {
    registerDeps(createDeps(createBackups()));

    expect(productionRestoreWarningView('backups:pr:backup-2')).toMatchObject({
      surface: 'production-restore-warning',
      text: expect.stringContaining('backup-management.view.production_restore_warning'),
    });
    expect(productionRestoreFinalConfirmView('backups:cpr:backup-2')).toMatchObject({
      surface: 'confirm-production-restore',
      text: expect.stringContaining('backup-management.view.production_restore_final_warning'),
    });
  });

  it('should return an unavailable message when no actor can confirm production restore', async () => {
    registerDeps(createDeps(createBackups()));

    const view = await executeProductionRestoreView(createContext(), 'backups:epr:backup-2');

    expect(view).toMatchObject({
      surface: 'leaf',
      text: 'backup-management.view.production_restore_unavailable',
    });
  });

  it('should return a safe failure message when production restore fails', async () => {
    const backups = createBackups();
    backups.restoreProductionBackup = vi.fn().mockResolvedValue({
      success: false,
      error: { code: 'backup-engine.production_restore_failed' },
    });
    const deps = createDeps(backups);
    registerDeps(deps);

    const view = await executeProductionRestoreView(createContext(123), 'backups:epr:backup-2');

    expect(backups.restoreProductionBackup).toHaveBeenCalledWith('backup-2', '123');
    expect(deps.logger.warn).toHaveBeenCalledWith({
      msg: 'backup_production_restore_failed',
      errorCode: 'backup-engine.production_restore_failed',
    });
    expect(view).toMatchObject({
      surface: 'leaf',
      text: 'backup-management.view.production_restore_failed',
    });
  });
});
