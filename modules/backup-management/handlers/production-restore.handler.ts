import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import type { BackupMenuItem, BackupMenuSurface } from '../menus/backup-menu.factory.js';

interface BackupView {
  readonly backups?: readonly BackupMenuItem[];
  readonly text: string;
  readonly surface: BackupMenuSurface;
}

export function productionRestoreWarningView(callbackData: string): BackupView {
  const backupId = callbackData.replace('backups:pr:', '');
  return {
    backups: [{ id: backupId, requestedAt: '' }],
    text: getDeps().i18n.t('backup-management.view.production_restore_warning', { id: backupId }),
    surface: 'production-restore-warning',
  };
}

export function productionRestoreFinalConfirmView(callbackData: string): BackupView {
  const backupId = callbackData.replace('backups:cpr:', '');
  return {
    backups: [{ id: backupId, requestedAt: '' }],
    text: getDeps().i18n.t('backup-management.view.production_restore_final_warning', {
      id: backupId,
    }),
    surface: 'confirm-production-restore',
  };
}

export async function executeProductionRestoreView(
  ctx: Context,
  callbackData: string,
): Promise<BackupView> {
  const { backups } = getDeps();
  const actorId = ctx.from?.id ? String(ctx.from.id) : undefined;
  if (!backups || !actorId)
    return leafView('backup-management.view.production_restore_unavailable');

  const backupId = callbackData.replace('backups:epr:', '');
  const result = await backups.restoreProductionBackup(backupId, actorId);
  if (!result.success) {
    getDeps().logger.warn({
      msg: 'backup_production_restore_failed',
      errorCode: result.error.code,
    });
    return leafView('backup-management.view.production_restore_failed');
  }

  return leafView('backup-management.view.production_restore_completed', {
    id: result.value.id,
    backupId: result.value.backupJobId,
    preRestoreBackupId: result.value.preRestoreBackupJobId,
  });
}

function leafView(key: string, options?: Record<string, unknown>): BackupView {
  return {
    text: getDeps().i18n.t(key, options),
    surface: 'leaf',
  };
}
