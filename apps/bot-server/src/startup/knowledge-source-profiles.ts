import path from 'node:path';
import type { AIContentType } from '@tempot/ai-core';
import type { KnowledgeSourceProfile } from '../module-providers.types.js';

export interface InternalKnowledgeProfile {
  readonly id: string;
  readonly labelKey: string;
  readonly roots: readonly string[];
  readonly contentType: AIContentType;
  readonly languagePolicy: string;
  readonly sourcePriority: number;
  readonly sourceOfTruth: boolean;
}

export const knowledgeSourceRoot =
  process.env['TEMPOT_KNOWLEDGE_SOURCES_ROOT'] ?? '/app/knowledge-sources';

export const knowledgeProfiles: readonly InternalKnowledgeProfile[] = [
  profile({
    id: 'product-help',
    labelKey: 'knowledge-management.source.product_help',
    roots: ['docs/product'],
    contentType: 'ui-guide',
    sourcePriority: 70,
    sourceOfTruth: false,
  }),
  profile({
    id: 'admin-ops',
    labelKey: 'knowledge-management.source.admin_ops',
    roots: ['docs/operations', 'docs/architecture'],
    contentType: 'developer-docs',
    sourcePriority: 80,
    sourceOfTruth: true,
  }),
  profile({
    id: 'developer-docs',
    labelKey: 'knowledge-management.source.developer_docs',
    roots: ['specs', 'packages', 'modules'],
    contentType: 'developer-docs',
    sourcePriority: 75,
    sourceOfTruth: false,
  }),
  profile({
    id: 'full-project',
    labelKey: 'knowledge-management.source.full_project',
    roots: ['docs', 'specs', 'packages', 'modules'],
    contentType: 'developer-docs',
    sourcePriority: 70,
    sourceOfTruth: false,
  }),
];

export function findKnowledgeProfile(id: string): InternalKnowledgeProfile | undefined {
  return knowledgeProfiles.find((item) => item.id === id);
}

export function toSafeKnowledgeRoot(root: string): string {
  const base = path.resolve(knowledgeSourceRoot);
  const resolved = path.resolve(base, root);
  if (!resolved.startsWith(base)) throw new Error('knowledge.profile_not_allowed');
  return resolved;
}

export function toPublicProfile(
  profileValue: InternalKnowledgeProfile,
  mounted: boolean,
): KnowledgeSourceProfile {
  return {
    ...profileValue,
    rootLabels: profileValue.roots,
    mounted,
  };
}

function profile(input: {
  readonly id: string;
  readonly labelKey: string;
  readonly roots: readonly string[];
  readonly contentType: AIContentType;
  readonly sourcePriority: number;
  readonly sourceOfTruth: boolean;
}): InternalKnowledgeProfile {
  return {
    id: input.id,
    labelKey: input.labelKey,
    roots: input.roots,
    contentType: input.contentType,
    languagePolicy: 'mixed',
    sourcePriority: input.sourcePriority,
    sourceOfTruth: input.sourceOfTruth,
  };
}
