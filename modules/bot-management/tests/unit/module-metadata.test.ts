import { describe, expect, it } from 'vitest';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import config from '../../module.config.js';
import { moduleManifest } from '../../module.manifest.js';
import { canDoBotManagement } from '../../abilities.js';

function user(role: RoleEnum): SessionUser {
  return { id: `${role.toLowerCase()}-1`, role };
}

describe('bot-management module metadata', () => {
  it('declares bot command shortcuts and required platform capabilities', () => {
    expect(config.name).toBe('bot-management');
    expect(config.commands.map((command) => command.command)).toEqual(['bots', 'new_bot']);
    expect(config.features.hasDatabase).toBe(true);
    expect(config.features.hasNotifications).toBe(true);
    expect(config.features.hasSearch).toBe(true);
    expect(config.features.hasImport).toBe(true);
    expect(config.features.hasExport).toBe(true);
    expect(config.features.hasAI).toBe(false);
  });

  it('declares selected blueprints and published domain events', () => {
    expect(moduleManifest.name).toBe('bot-management');
    expect(moduleManifest.capabilities).toEqual([
      'crud',
      'workflow',
      'searchable',
      'importable',
      'exportable',
      'notifiable',
      'admin-managed',
    ]);
    expect(moduleManifest.commands).toEqual(['bots', 'new_bot']);
    expect(moduleManifest.events.publishes).toContain('bot-management.lifecycle.changed');
    expect(moduleManifest.events.publishes).toContain('bot-management.export.completed');
  });
});

describe('bot-management abilities', () => {
  it('allows administrators to manage bot profiles', () => {
    expect(canDoBotManagement(user(RoleEnum.ADMIN), 'manage', 'bot')).toBe(true);
  });

  it('allows super administrators to manage all bot-management subjects', () => {
    expect(canDoBotManagement(user(RoleEnum.SUPER_ADMIN), 'manage', 'all')).toBe(true);
  });

  it('does not allow guests to manage bot profiles', () => {
    expect(canDoBotManagement(user(RoleEnum.GUEST), 'manage', 'bot')).toBe(false);
  });
});
