export const moduleManifest = {
  name: 'knowledge-management',
  type: 'operations',
  blueprint: 'admin-operations',
  status: 'active',
  capabilities: ['rag-status', 'rag-ingestion', 'rag-test-query'] as const,
  commands: ['knowledge'] as const,
  events: {
    publishes: [
      'knowledge.ingestion.dry_run_requested',
      'knowledge.ingestion.write_requested',
      'knowledge.ingestion.full_reindex_requested',
    ] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;
