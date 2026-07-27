import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('backup-management module config', () => {
  it('should expose a super-admin backup command and menu item', () => {
    expect(config.name).toBe('backup-management');
    expect(config.requiredRole).toBe('SUPER_ADMIN');
    expect(config.commands[0]?.command).toBe('backups');
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('backups:view');
    expect(config.requires.packages).toContain('@tempot/backup-engine');
  });
});
