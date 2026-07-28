import { randomUUID } from 'node:crypto';
import type {
  KnowledgeIngestionSummary,
  KnowledgeOperationsProvider,
  KnowledgeOperationResult,
  KnowledgeSourceProfile,
  KnowledgeTestQueryResult,
  KnowledgeWriteConfirmation,
  RagReadinessSnapshot,
} from '../module-providers.types.js';
import type { ModuleEventBus, ModuleLogger } from '../bot-server.types.js';
import type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';
import { scanKnowledgeProfile } from './knowledge-ingestion-runner.js';
import { liveKnowledgeDeps } from './knowledge-live-runtime.js';
import {
  findKnowledgeProfile,
  knowledgeProfiles,
  toPublicProfile,
  toSafeKnowledgeRoot,
} from './knowledge-source-profiles.js';

export type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';

type Confirmation = { profileId: string; expiresAt: number };
type RuntimeState = {
  readonly deps: KnowledgeProviderDeps;
  readonly jobs: KnowledgeIngestionSummary[];
};

const confirmationTtlMs = 10 * 60 * 1000;

export function createKnowledgeOperationsProvider(
  deps: KnowledgeProviderDeps,
): KnowledgeOperationsProvider {
  const jobs: KnowledgeIngestionSummary[] = [];
  const confirmations = new Map<string, Confirmation>();
  const state = { deps, jobs };
  return {
    getReadiness: async () => readiness(deps),
    listSourceProfiles: async () => okValue(await publicProfiles(deps)),
    runDryRun: async (_actorId, profileId) => run(state, profileId, false),
    requestWrite: async (_actorId, profileId) => requestWrite(deps, confirmations, profileId),
    confirmWrite: async (_actorId, token) => confirmWrite(state, confirmations, token),
    requestFullReindex: async (_actorId, profileId) => requestWrite(deps, confirmations, profileId),
    confirmFullReindex: async (_actorId, token) => confirmWrite(state, confirmations, token),
    listJobs: async (_actorId, limit) => okValue(jobs.slice(0, limit)),
    testQuery: async () => testQueryResult(),
  };
}

export function buildKnowledgeOperationsProvider(opts: {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
}): KnowledgeOperationsProvider {
  return createKnowledgeOperationsProvider(liveKnowledgeDeps(opts));
}

async function readiness(
  deps: KnowledgeProviderDeps,
): Promise<KnowledgeOperationResult<RagReadinessSnapshot>> {
  try {
    const visibleProfiles = await publicProfiles(deps);
    return okValue({
      aiEnabled: deps.aiEnabled(),
      providerConfigured: deps.providerConfigured(),
      databaseConfigured: deps.databaseConfigured(),
      vectorReady: await deps.vectorReady(),
      embeddingsCount: await deps.countEmbeddings(),
      mountedProfiles: visibleProfiles.filter((item) => item.mounted).length,
      profileCount: visibleProfiles.length,
    });
  } catch (error) {
    deps.logger.warn({ msg: 'knowledge_readiness_failed', error: safeError(error) });
    return fail('knowledge.readiness_failed');
  }
}

async function requestWrite(
  deps: KnowledgeProviderDeps,
  confirmations: Map<string, Confirmation>,
  profileId: string,
): Promise<KnowledgeOperationResult<KnowledgeWriteConfirmation>> {
  const dryRun = await run({ deps, jobs: [] }, profileId, false);
  if (!dryRun.success || dryRun.value.failed > 0) return fail('knowledge.write_blocked');
  const token = randomUUID();
  confirmations.set(token, { profileId, expiresAt: Date.now() + confirmationTtlMs });
  return okValue({ token, profileId, summary: dryRun.value });
}

async function confirmWrite(
  state: RuntimeState,
  confirmations: Map<string, Confirmation>,
  token: string,
): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>> {
  const confirmation = confirmations.get(token);
  if (!confirmation || confirmation.expiresAt < Date.now()) {
    return fail('knowledge.confirmation_expired');
  }
  confirmations.delete(token);
  return run(state, confirmation.profileId, true);
}

async function run(
  state: RuntimeState,
  profileId: string,
  write: boolean,
): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>> {
  const selected = findKnowledgeProfile(profileId);
  if (!selected) return fail('knowledge.profile_not_allowed');
  const summary = await scanKnowledgeProfile(state.deps, selected, write);
  state.jobs.unshift(summary);
  return okValue(summary);
}

async function publicProfiles(deps: KnowledgeProviderDeps): Promise<KnowledgeSourceProfile[]> {
  const profiles: KnowledgeSourceProfile[] = [];
  for (const item of knowledgeProfiles) {
    profiles.push(toPublicProfile(item, await allRootsMounted(deps, item.roots)));
  }
  return profiles;
}

async function allRootsMounted(
  deps: KnowledgeProviderDeps,
  roots: readonly string[],
): Promise<boolean> {
  const checks = await Promise.all(roots.map((root) => deps.pathExists(toSafeKnowledgeRoot(root))));
  return checks.every(Boolean);
}

function testQueryResult(): KnowledgeOperationResult<KnowledgeTestQueryResult> {
  return okValue({ state: 'no-context', resultCount: 0, citations: [] });
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
