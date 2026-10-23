import type { ModuleManifest } from '@tembot/kernel-registry';

export const systemSettingsManifest: ModuleManifest = {
  id: 'system-settings',
  version: '0.1.0',
  category: 'kernel',
  context: 'governance-hub',
  requires: ['audit-log'],
  capabilities: ['settings:read', 'settings:write'],
  slices: [
    {
      sliceId: 'get-surface-settings',
      kind: 'interactive',
      entrypoints: ['bot', 'tma', 'dashboard', 'http'],
    },
    {
      sliceId: 'update-system-settings',
      kind: 'interactive',
      entrypoints: ['dashboard', 'bot', 'http'],
    },
    {
      sliceId: 'check-maintenance-mode',
      kind: 'headless',
      entrypoints: ['internal', 'http', 'bot'],
    },
  ],
};
