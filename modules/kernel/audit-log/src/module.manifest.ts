import type { ModuleManifest } from '@tembot/kernel-registry';

export const auditLogManifest: ModuleManifest = {
  id: 'audit-log',
  version: '0.1.0',
  category: 'kernel',
  context: 'observability-hub',
  requires: [],
  capabilities: [
    'audit:read',
    'audit:export',
    'audit:record',
    'error:capture',
  ],
  slices: [
    {
      sliceId: 'record-audit-event',
      kind: 'headless',
      entrypoints: ['internal', 'event', 'http'],
    },
    {
      sliceId: 'query-audit-trail',
      kind: 'interactive',
      entrypoints: ['dashboard', 'http'],
    },
    {
      sliceId: 'capture-error-diagnostic',
      kind: 'headless',
      entrypoints: ['internal', 'event'],
    },
  ],
};
