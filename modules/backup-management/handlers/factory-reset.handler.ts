import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import type { BackupMenuSurface } from '../menus/backup-menu.factory.js';

interface BackupView {
  readonly text: string;
  readonly surface: BackupMenuSurface;
}

export function factoryResetWarningView(): BackupView {
  return {
    text: getDeps().i18n.t('backup-management.view.factory_reset_warning'),
    surface: 'factory-reset-warning',
  };
}

export function factoryResetFinalConfirmView(): BackupView {
  return {
    text: getDeps().i18n.t('backup-management.view.factory_reset_final_warning'),
    surface: 'confirm-factory-reset',
  };
}

export async function executeFactoryResetView(ctx: Context): Promise<BackupView> {
  const { backups } = getDeps();
  const actorId = ctx.from?.id ? String(ctx.from.id) : undefined;
  if (!backups || !actorId) return leafView('backup-management.view.factory_reset_unavailable');

  const result = await backups.factoryResetDatabase(actorId);
  if (!result.success) {
    getDeps().logger.warn({ msg: 'backup_factory_reset_failed', errorCode: result.error.code });
    return leafView('backup-management.view.factory_reset_failed');
  }

  return leafView('backup-management.view.factory_reset_completed', {
    id: result.value.id,
    preResetBackupId: result.value.preResetBackupJobId,
  });
}

function leafView(key: string, options?: Record<string, unknown>): BackupView {
  return {
    text: getDeps().i18n.t(key, options),
    surface: 'leaf',
  };
}
