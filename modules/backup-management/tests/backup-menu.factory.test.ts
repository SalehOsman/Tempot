import { describe, expect, it } from 'vitest';
import { createBackupMenu } from '../menus/backup-menu.factory.js';

const labels: Record<string, string> = {
  'backup-management.menu.button': '🗄️ Backups',
  'backup-management.menu.request': '📦 Create backup',
  'backup-management.menu.history': '📜 Backup history',
  'backup-management.menu.restore': '🧪 Restore test',
  'backup-management.menu.retention': '🧹 Retention',
  'backup-management.menu.factory_reset': '♻️ Factory reset',
  'backup-management.menu.confirm_factory_reset': '⚠️ Confirm reset',
  'backup-management.menu.back': '↩️ Back',
};

interface KeyboardButton {
  callback_data?: string;
  text: string;
}

interface KeyboardShape {
  inline_keyboard: KeyboardButton[][];
}

function t(key: string): string {
  return labels[key] ?? key;
}

function readKeyboardRows(keyboard: unknown): KeyboardButton[][] {
  return (keyboard as KeyboardShape).inline_keyboard;
}

describe('createBackupMenu', () => {
  it('should render compact icon-led backup actions with one action per row', () => {
    const rows = readKeyboardRows(createBackupMenu(t));

    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.length === 1)).toBe(true);
    expect(rows.map((row) => row[0]?.text)).toEqual([
      '📦 Create backup',
      '📜 Backup history',
      '🧪 Restore test',
      '🧹 Retention',
      '♻️ Factory reset',
      '↩️ Back',
    ]);
    expect(rows.flat().every((button) => Array.from(button.text).length <= 24)).toBe(true);
  });

  it('should render compact icon-led leaf navigation actions', () => {
    const rows = readKeyboardRows(createBackupMenu(t, 'leaf'));

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === 1)).toBe(true);
    expect(rows.map((row) => row[0]?.text)).toEqual(['🗄️ Backups', '↩️ Back']);
  });
  it('should render successful backups as one restore selection per row', () => {
    const rows = readKeyboardRows(
      createBackupMenu(t, 'select-restore', [
        { id: 'backup-1', requestedAt: '2026-07-27T01:50:00.000Z' },
        { id: 'backup-2', requestedAt: '2026-07-27T02:05:00.000Z' },
      ]),
    );

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.length === 1)).toBe(true);
    expect(rows[0]?.[0]?.callback_data).toBe('backups:restore_select:backup-1');
    expect(rows[1]?.[0]?.callback_data).toBe('backups:restore_select:backup-2');
  });

  it('should render production restore confirmation actions one per row', () => {
    const rows = readKeyboardRows(
      createBackupMenu(t, 'confirm-production-restore', [
        { id: 'backup-1', requestedAt: '2026-07-27T01:50:00.000Z' },
      ]),
    );

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === 1)).toBe(true);
    expect(rows[0]?.[0]?.callback_data).toBe('backups:epr:backup-1');
    expect(rows[1]?.[0]?.callback_data).toBe('backups:view');
  });

  it('should keep production restore callback data within Telegram limits', () => {
    const rows = readKeyboardRows(
      createBackupMenu(t, 'production-restore-warning', [
        { id: 'c373745b-c6ad-448e-a29e-b9bd0468cb33', requestedAt: '' },
      ]),
    );

    const callbackData = rows[0]?.[0]?.callback_data ?? '';
    expect(Buffer.byteLength(callbackData, 'utf8')).toBeLessThanOrEqual(64);
    expect(callbackData).toBe('backups:cpr:c373745b-c6ad-448e-a29e-b9bd0468cb33');
  });

  it('should render factory reset confirmation actions one per row', () => {
    const rows = readKeyboardRows(createBackupMenu(t, 'confirm-factory-reset'));

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === 1)).toBe(true);
    expect(rows[0]?.[0]?.callback_data).toBe('backups:execute_factory_reset');
    expect(rows[1]?.[0]?.callback_data).toBe('backups:view');
  });
});
