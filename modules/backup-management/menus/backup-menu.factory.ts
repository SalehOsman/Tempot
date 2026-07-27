import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
export type BackupMenuSurface =
  | 'main'
  | 'leaf'
  | 'confirm-request'
  | 'confirm-restore'
  | 'restore-completed'
  | 'production-restore-warning'
  | 'confirm-production-restore'
  | 'factory-reset-warning'
  | 'confirm-factory-reset'
  | 'select-restore';

export interface BackupMenuItem {
  readonly id: string;
  readonly requestedAt: string;
}

export function createBackupMenu(
  t: TranslationFn,
  surface: BackupMenuSurface = 'main',
  backups: readonly BackupMenuItem[] = [],
): InlineKeyboard {
  if (surface === 'confirm-request') return createBackupConfirmMenu(t);
  if (surface === 'confirm-restore') return createRestoreConfirmMenu(t, backups[0]?.id);
  if (surface === 'restore-completed') return createRestoreCompletedMenu(t, backups[0]?.id);
  if (surface === 'production-restore-warning') {
    return createProductionWarningMenu(t, backups[0]?.id);
  }
  if (surface === 'confirm-production-restore') {
    return createProductionConfirmMenu(t, backups[0]?.id);
  }
  if (surface === 'factory-reset-warning') return createFactoryResetWarningMenu(t);
  if (surface === 'confirm-factory-reset') return createFactoryResetConfirmMenu(t);
  if (surface === 'select-restore') return createRestoreSelectionMenu(t, backups);
  if (surface === 'leaf') return createBackupLeafMenu(t);
  return createBackupMainMenu(t);
}

function createBackupMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('backup-management.menu.request'), 'backups:request')
    .row()
    .text(t('backup-management.menu.history'), 'backups:history')
    .row()
    .text(t('backup-management.menu.restore'), 'backups:restore')
    .row()
    .text(t('backup-management.menu.retention'), 'backups:retention')
    .row()
    .text(t('backup-management.menu.factory_reset'), 'backups:factory_reset')
    .row()
    .text(t('backup-management.menu.back'), 'menu:main');
}

function createBackupLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('backup-management.menu.button'), 'backups:view')
    .row()
    .text(t('backup-management.menu.back'), 'menu:main');
}

function createBackupConfirmMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('backup-management.menu.confirm_request'), 'backups:confirm_request')
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createRestoreConfirmMenu(t: TranslationFn, backupId: string | undefined): InlineKeyboard {
  const callbackData = backupId ? `backups:confirm_restore:${backupId}` : 'backups:confirm_restore';
  return new InlineKeyboard()
    .text(t('backup-management.menu.confirm_restore'), callbackData)
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createRestoreCompletedMenu(
  t: TranslationFn,
  backupId: string | undefined,
): InlineKeyboard {
  const callbackData = backupId ? `backups:pr:${backupId}` : 'backups:view';
  return new InlineKeyboard()
    .text(t('backup-management.menu.production_restore'), callbackData)
    .row()
    .text(t('backup-management.menu.button'), 'backups:view');
}

function createProductionWarningMenu(
  t: TranslationFn,
  backupId: string | undefined,
): InlineKeyboard {
  const callbackData = backupId ? `backups:cpr:${backupId}` : 'backups:view';
  return new InlineKeyboard()
    .text(t('backup-management.menu.production_restore'), callbackData)
    .row()
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createProductionConfirmMenu(
  t: TranslationFn,
  backupId: string | undefined,
): InlineKeyboard {
  const callbackData = backupId ? `backups:epr:${backupId}` : 'backups:view';
  return new InlineKeyboard()
    .text(t('backup-management.menu.confirm_production_restore'), callbackData)
    .row()
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createFactoryResetWarningMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('backup-management.menu.factory_reset'), 'backups:confirm_factory_reset')
    .row()
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createFactoryResetConfirmMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('backup-management.menu.confirm_factory_reset'), 'backups:execute_factory_reset')
    .row()
    .text(t('backup-management.menu.cancel'), 'backups:view');
}

function createRestoreSelectionMenu(
  t: TranslationFn,
  backups: readonly BackupMenuItem[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const backup of backups) {
    keyboard
      .text(
        t('backup-management.menu.restore_item', {
          createdAt: formatBackupDate(backup.requestedAt),
        }),
        `backups:restore_select:${backup.id}`,
      )
      .row();
  }
  return keyboard.text(t('backup-management.menu.back'), 'backups:view');
}

function formatBackupDate(value: string): string {
  return value.slice(0, 16).replace('T', ' ');
}
