import type { ModuleConfig } from '@tempot/module-registry';
import { describe, expect, it } from 'vitest';
import { createModuleNavigationProvider } from '../../../src/startup/module-navigation.provider.js';

function createConfig(): ModuleConfig {
  return {
    name: 'test-navigation',
    version: '0.1.0',
    requiredRole: 'USER',
    isActive: true,
    isCore: false,
    commands: [],
    navigation: {
      mainMenu: [
        {
          id: 'profile',
          labelKey: 'profile',
          callbackData: 'profile:view',
          requiredRole: 'USER',
          accessClassification: 'protected',
          requiredAbility: 'read.profile',
          row: 0,
          order: 10,
        },
        {
          id: 'membership',
          labelKey: 'membership',
          callbackData: 'membership:list',
          requiredRole: 'ADMIN',
          accessClassification: 'admin',
          requiredAbility: 'manage.membership-request',
          row: 0,
          order: 20,
        },
        {
          id: 'help',
          labelKey: 'help',
          callbackData: 'help:view',
          requiredRole: 'USER',
          accessClassification: 'protected',
          row: 1,
          order: 10,
        },
      ],
    },
    features: {
      hasDatabase: false,
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasImport: false,
      hasAI: false,
      hasInputEngine: false,
      hasSearch: false,
      hasDynamicCMS: false,
      hasRegional: false,
    },
    requires: {
      packages: [],
      optional: [],
    },
  };
}

function createRoleSnapshotConfig(): ModuleConfig {
  return {
    name: 'role-snapshot-navigation',
    version: '0.1.0',
    requiredRole: 'GUEST',
    isActive: true,
    isCore: false,
    commands: [],
    navigation: {
      mainMenu: [
        {
          id: 'help',
          labelKey: 'help',
          callbackData: 'help:view',
          requiredRole: 'GUEST',
          accessClassification: 'public',
          row: 0,
          order: 0,
        },
        {
          id: 'profile',
          labelKey: 'profile',
          callbackData: 'profile:view',
          requiredRole: 'USER',
          accessClassification: 'protected',
          requiredAbility: 'read.profile',
          row: 0,
          order: 10,
        },
        {
          id: 'settings',
          labelKey: 'settings',
          callbackData: 'settings:view',
          requiredRole: 'USER',
          accessClassification: 'protected',
          requiredAbility: 'read.settings',
          row: 0,
          order: 20,
        },
        {
          id: 'membership',
          labelKey: 'membership',
          callbackData: 'membership:list',
          requiredRole: 'ADMIN',
          accessClassification: 'admin',
          requiredAbility: 'manage.membership-request',
          row: 1,
          order: 10,
        },
      ],
    },
    features: {
      hasDatabase: false,
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasImport: false,
      hasAI: false,
      hasInputEngine: false,
      hasSearch: false,
      hasDynamicCMS: false,
      hasRegional: false,
    },
    requires: {
      packages: [],
      optional: [],
    },
  };
}

describe('createModuleNavigationProvider', () => {
  it('filters visible menu entries by role and required ability', () => {
    const provider = createModuleNavigationProvider([createConfig()]);

    expect(
      provider
        .getVisibleMainMenuItems({ role: 'USER', abilities: ['read.profile'] })
        .map((entry) => entry.id),
    ).toEqual(['profile', 'help']);

    expect(
      provider
        .getVisibleMainMenuItems({
          role: 'ADMIN',
          abilities: ['read.profile', 'manage.membership-request'],
        })
        .map((entry) => entry.id),
    ).toEqual(['profile', 'membership', 'help']);
  });

  it('allows super admins with manage.all to see ability-gated entries', () => {
    const provider = createModuleNavigationProvider([createConfig()]);

    expect(
      provider
        .getVisibleMainMenuItems({ role: 'SUPER_ADMIN', abilities: ['manage.all'] })
        .map((entry) => entry.id),
    ).toEqual(['profile', 'membership', 'help']);
  });

  it('keeps the legacy role-only menu API for existing modules', () => {
    const provider = createModuleNavigationProvider([createConfig()]);

    expect(provider.getMainMenuItems('USER').map((entry) => entry.id)).toEqual(['profile', 'help']);
  });

  it('matches role-filtered menu snapshots for access-mode actors', () => {
    const provider = createModuleNavigationProvider([createRoleSnapshotConfig()]);

    const snapshots = {
      UNKNOWN: provider
        .getVisibleMainMenuItems({ role: 'GUEST', abilities: [] })
        .map((entry) => entry.id),
      PENDING: provider
        .getVisibleMainMenuItems({ role: 'GUEST', abilities: [] })
        .map((entry) => entry.id),
      USER: provider
        .getVisibleMainMenuItems({ role: 'USER', abilities: ['read.profile', 'read.settings'] })
        .map((entry) => entry.id),
      ADMIN: provider
        .getVisibleMainMenuItems({
          role: 'ADMIN',
          abilities: ['read.profile', 'read.settings', 'manage.membership-request'],
        })
        .map((entry) => entry.id),
      SUPER_ADMIN: provider
        .getVisibleMainMenuItems({ role: 'SUPER_ADMIN', abilities: ['manage.all'] })
        .map((entry) => entry.id),
    };

    expect(snapshots).toMatchInlineSnapshot(`
      {
        "ADMIN": [
          "help",
          "profile",
          "settings",
          "membership",
        ],
        "PENDING": [
          "help",
        ],
        "SUPER_ADMIN": [
          "help",
          "profile",
          "settings",
          "membership",
        ],
        "UNKNOWN": [
          "help",
        ],
        "USER": [
          "help",
          "profile",
          "settings",
        ],
      }
    `);
  });
});
