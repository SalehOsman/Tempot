import type { Context, NextFunction } from 'grammy';
import type { BackupJob } from '@tempot/backup-engine';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import type { BackupMenuItem, BackupMenuSurface } from '../menus/backup-menu.factory.js';
import { createBackupMenu } from '../menus/backup-menu.factory.js';
import {
  executeProductionRestoreView,
  productionRestoreFinalConfirmView,
  productionRestoreWarningView,
} from './production-restore.handler.js';
import {
  executeFactoryResetView,
  factoryResetFinalConfirmView,
  factoryResetWarningView,
} from './factory-reset.handler.js';

const noopNext: NextFunction = () => Promise.resolve();
const historyLimit = 5;

interface BackupView {
  readonly backups?: readonly BackupMenuItem[];
  readonly text: string;
  readonly surface: BackupMenuSurface;
}

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('backups:')) {
    await next();
    return;
  }

  if (
    !(await getDeps().authorization.enforce(ctx, {
      module: 'backup-management',
      classification: 'admin',
      action: 'manage',
      subject: 'backups',
    }))
  ) {
    return;
  }

  const { i18n } = getDeps();
  const view = await resolveView(ctx, data);
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: view.text,
    parseMode: 'HTML',
    replyMarkup: createBackupMenu(i18n.t, view.surface, view.backups),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function resolveView(ctx: Context, callbackData: string): Promise<BackupView> {
  if (callbackData === 'backups:request') return requestConfirmationView();
  if (callbackData === 'backups:confirm_request') return confirmBackupRequestView(ctx);
  if (callbackData === 'backups:history') return backupHistoryView();
  if (callbackData === 'backups:restore') return restoreSelectionView();
  if (callbackData.startsWith('backups:restore_select:')) {
    return restoreConfirmationView(callbackData);
  }
  if (callbackData.startsWith('backups:confirm_restore'))
    return confirmRestoreView(ctx, callbackData);
  if (callbackData.startsWith('backups:pr:')) {
    return productionRestoreWarningView(callbackData);
  }
  if (callbackData.startsWith('backups:cpr:')) {
    return productionRestoreFinalConfirmView(callbackData);
  }
  if (callbackData.startsWith('backups:epr:')) {
    return executeProductionRestoreView(ctx, callbackData);
  }
  if (callbackData === 'backups:factory_reset') return factoryResetWarningView();
  if (callbackData === 'backups:confirm_factory_reset') return factoryResetFinalConfirmView();
  if (callbackData === 'backups:execute_factory_reset') return executeFactoryResetView(ctx);
  if (callbackData === 'backups:retention')
    return leafView('backup-management.view.retention_summary');
  return { text: getDeps().i18n.t('backup-management.view.title'), surface: 'main' };
}

function requestConfirmationView(): BackupView {
  return {
    text: getDeps().i18n.t('backup-management.view.request_confirm'),
    surface: 'confirm-request',
  };
}

function restoreConfirmationView(callbackData: string): BackupView {
  const backupId = callbackData.replace('backups:restore_select:', '');
  return {
    backups: [{ id: backupId, requestedAt: '' }],
    text: getDeps().i18n.t('backup-management.view.restore_confirm', { id: backupId }),
    surface: 'confirm-restore',
  };
}

async function confirmBackupRequestView(ctx: Context): Promise<BackupView> {
  const { backups } = getDeps();
  const actorId = ctx.from?.id ? String(ctx.from.id) : undefined;
  if (!backups || !actorId) return leafView('backup-management.view.request_unavailable');

  const result = await backups.requestBackup(actorId);
  if (!result.success) {
    getDeps().logger.warn({ msg: 'backup_request_failed', errorCode: result.error.code });
    return leafView('backup-management.view.request_failed');
  }

  return leafView('backup-management.view.request_submitted', {
    id: result.value.job.id,
    storageReference: result.value.storageReference ?? result.value.artifact?.storageReference,
  });
}

async function restoreSelectionView(): Promise<BackupView> {
  const { backups } = getDeps();
  if (!backups) return leafView('backup-management.view.restore_unavailable');

  const result = await backups.listBackups(historyLimit);
  if (!result.success) return leafView('backup-management.view.history_unavailable');

  const successfulBackups = result.value.jobs.filter((job) => job.status === 'succeeded');
  if (successfulBackups.length === 0) return leafView('backup-management.view.restore_empty');
  return {
    backups: successfulBackups,
    text: getDeps().i18n.t('backup-management.view.restore_select', {
      count: successfulBackups.length,
    }),
    surface: 'select-restore',
  };
}

async function confirmRestoreView(ctx: Context, callbackData: string): Promise<BackupView> {
  const { backups } = getDeps();
  const actorId = ctx.from?.id ? String(ctx.from.id) : undefined;
  if (!backups || !actorId) return leafView('backup-management.view.restore_unavailable');

  const backupId = callbackData.replace('backups:confirm_restore:', '');
  const result =
    backupId === 'backups:confirm_restore'
      ? await backups.restoreLatest(actorId)
      : await backups.restoreBackup(backupId, actorId);
  if (!result.success) {
    getDeps().logger.warn({ msg: 'backup_restore_failed', errorCode: result.error.code });
    return leafView('backup-management.view.restore_failed');
  }

  return {
    backups: [{ id: result.value.backupJobId, requestedAt: result.value.requestedAt }],
    text: getDeps().i18n.t('backup-management.view.restore_completed', {
      id: result.value.id,
      backupId: result.value.backupJobId,
    }),
    surface: 'restore-completed',
  };
}

async function backupHistoryView(): Promise<BackupView> {
  const { backups } = getDeps();
  if (!backups) return leafView('backup-management.view.history_unavailable');

  const result = await backups.listBackups(historyLimit);
  if (!result.success) return leafView('backup-management.view.history_unavailable');
  if (result.value.jobs.length === 0) return leafView('backup-management.view.history_empty');

  return {
    text: formatHistory(result.value.jobs),
    surface: 'leaf',
  };
}

function formatHistory(jobs: readonly BackupJob[]): string {
  const { i18n } = getDeps();
  const lines = jobs.map((job, index) =>
    i18n.t('backup-management.view.history_item', {
      id: job.id,
      index: index + 1,
      scope: i18n.t(`backup-management.scope.${job.scope}`),
      status: i18n.t(`backup-management.status.${job.status}`),
    }),
  );
  return [i18n.t('backup-management.view.history_title', { count: jobs.length }), ...lines].join(
    '\n',
  );
}

function leafView(key: string, options?: Record<string, unknown>): BackupView {
  return {
    text: getDeps().i18n.t(key, options),
    surface: 'leaf',
  };
}
