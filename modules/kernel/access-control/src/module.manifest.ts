import type { ModuleManifest } from '@tembot/kernel-registry';

export const accessControlManifest: ModuleManifest = {
  id: 'access-control',
  version: '0.1.0',
  category: 'kernel',
  context: 'governance-hub',
  requires: ['audit-log'],
  capabilities: ['auth:authenticate', 'auth:revoke', 'access:manage', 'operator:manage'],
  slices: [
    {
      sliceId: 'validate-telegram-init-data',
      kind: 'headless',
      entrypoints: ['tma', 'http', 'bot'],
    },
    {
      sliceId: 'operator-session-lifecycle',
      kind: 'headless',
      entrypoints: ['dashboard', 'http'],
    },
    {
      sliceId: 'evaluate-capability-guard',
      kind: 'headless',
      entrypoints: ['internal'],
    },
  ],
};
