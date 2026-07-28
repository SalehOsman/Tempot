import path from 'node:path';
import type { AIContentType } from '@tempot/ai-core';
import type { KnowledgeSourceProfile } from '../module-providers.types.js';

export interface InternalKnowledgeProfile {
  readonly id: string;
  readonly labelKey: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly roots: readonly string[];
  readonly contentType: AIContentType;
  readonly languagePolicy: string;
  readonly sourcePriority: number;
  readonly sourceOfTruth: boolean;
  readonly custom: boolean;
}

export const knowledgeSourceRoot =
  process.env['TEMPOT_KNOWLEDGE_SOURCES_ROOT'] ?? '/app/knowledge-sources';

export const knowledgeProfiles: readonly InternalKnowledgeProfile[] = [
  profile({
    id: 'product',
    labelKey: 'knowledge-management.source.product_help',
    roots: ['docs/product'],
    contentType: 'ui-guide',
    sourcePriority: 70,
    sourceOfTruth: false,
  }),
  profile({
    id: 'operations',
    labelKey: 'knowledge-management.source.operations',
    roots: ['docs/operations'],
    contentType: 'developer-docs',
    sourcePriority: 80,
    sourceOfTruth: true,
  }),
  profile({
    id: 'architecture',
    labelKey: 'knowledge-management.source.architecture',
    roots: ['docs/architecture'],
    contentType: 'developer-docs',
    sourcePriority: 85,
    sourceOfTruth: true,
  }),
  profile({
    id: 'analysis',
    labelKey: 'knowledge-management.source.analysis',
    roots: ['docs/project-analysis'],
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

export function toSafeKnowledgeRoot(root: string): string {
  if (path.isAbsolute(root) || root.includes('..'))
    throw new Error('knowledge.profile_not_allowed');
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
  readonly displayName?: string;
  readonly description?: string;
  readonly roots: readonly string[];
  readonly contentType: AIContentType;
  readonly sourcePriority: number;
  readonly sourceOfTruth: boolean;
}): InternalKnowledgeProfile {
  return {
    id: input.id,
    labelKey: input.labelKey,
    displayName: input.displayName,
    description: input.description,
    roots: input.roots,
    contentType: input.contentType,
    languagePolicy: 'mixed',
    sourcePriority: input.sourcePriority,
    sourceOfTruth: input.sourceOfTruth,
    custom: false,
  };
}
