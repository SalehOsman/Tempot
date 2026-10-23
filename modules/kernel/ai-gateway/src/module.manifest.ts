import type { ModuleManifest } from '@tembot/kernel-registry';

export const aiGatewayManifest: ModuleManifest = {
  id: 'ai-gateway',
  version: '0.1.0',
  category: 'kernel',
  context: 'intelligence-hub',
  requires: ['audit-log'],
  capabilities: ['ai:evaluate', 'ai:generate', 'ai:manage'],
  slices: [
    {
      sliceId: 'evaluate-intent-decision',
      kind: 'headless',
      entrypoints: ['internal', 'event'],
    },
    {
      sliceId: 'generate-conversational-synthesis',
      kind: 'interactive',
      entrypoints: ['bot', 'tma', 'dashboard', 'http'],
    },
    {
      sliceId: 'query-ai-usage-analytics',
      kind: 'interactive',
      entrypoints: ['dashboard', 'http'],
    },
  ],
};
