import type {
  KnowledgeCustomProfileInput,
  KnowledgeOperationResult,
  KnowledgeSourceProfile,
} from '../module-providers.types.js';
import type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';
import {
  type InternalKnowledgeProfile,
  knowledgeProfiles,
  toPublicProfile,
  toSafeKnowledgeRoot,
} from './knowledge-source-profiles.js';
import { toCustomProfile } from './knowledge-custom-profiles.store.js';

export async function allKnowledgeProfiles(
  deps: KnowledgeProviderDeps,
): Promise<InternalKnowledgeProfile[]> {
  return [...knowledgeProfiles, ...(await deps.loadCustomProfiles())];
}

export async function findKnowledgeProfile(
  deps: KnowledgeProviderDeps,
  profileId: string,
): Promise<InternalKnowledgeProfile | undefined> {
  const normalized = profileId === 'product-help' ? 'product' : profileId;
  return (await allKnowledgeProfiles(deps)).find((item) => item.id === normalized);
}

export async function addCustomKnowledgeProfile(
  deps: KnowledgeProviderDeps,
  input: KnowledgeCustomProfileInput,
): Promise<KnowledgeOperationResult<KnowledgeSourceProfile>> {
  try {
    const root = normalizeCustomRoot(input.root);
    const profile = toCustomProfile({
      id: customProfileId(input.name),
      name: input.name.trim(),
      description: input.description.trim(),
      root,
    });
    await deps.saveCustomProfiles(await upsertCustomProfile(deps, profile));
    return okValue(toPublicProfile(profile, await allRootsMounted(deps, profile.roots)));
  } catch (error) {
    deps.logger.warn({ msg: 'knowledge_custom_profile_failed', error: safeError(error) });
    return fail('knowledge.custom_profile_failed');
  }
}

async function upsertCustomProfile(
  deps: KnowledgeProviderDeps,
  nextProfile: InternalKnowledgeProfile,
): Promise<InternalKnowledgeProfile[]> {
  const current = await deps.loadCustomProfiles();
  return [...current.filter((item) => item.id !== nextProfile.id), nextProfile];
}

async function allRootsMounted(
  deps: KnowledgeProviderDeps,
  roots: readonly string[],
): Promise<boolean> {
  const checks = await Promise.all(roots.map((root) => deps.pathExists(toSafeKnowledgeRoot(root))));
  return checks.every(Boolean);
}

function normalizeCustomRoot(root: string): string {
  const trimmed = root.trim().replace(/\\/g, '/');
  if (!trimmed) throw new Error('knowledge.root_required');
  toSafeKnowledgeRoot(trimmed);
  return trimmed;
}

function customProfileId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!slug) throw new Error('knowledge.name_required');
  return `custom-${slug}`.slice(0, 48);
}

function okValue<T>(value: T): KnowledgeOperationResult<T> {
  return { success: true, value };
}

function fail<T>(code: string): KnowledgeOperationResult<T> {
  return { success: false, error: { code } };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
