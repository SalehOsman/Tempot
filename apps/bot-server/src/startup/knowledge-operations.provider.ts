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
import { toPublicProfile, toSafeKnowledgeRoot } from './knowledge-source-profiles.js';
import {
  addCustomKnowledgeProfile,
  allKnowledgeProfiles,
  findKnowledgeProfile,
} from './knowledge-custom-profile.actions.js';
import { knowledgeIngestionFailureReason } from './knowledge-ingestion-error-reason.js';
import {
  readProviderSettings,
  updateChatProvider,
  updateEmbeddingModel,
  updateEmbeddingProvider,
} from './knowledge-provider-settings.operations.js';

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
    addCustomProfile: async (_actorId, input) => addCustomKnowledgeProfile(deps, input),
    runDryRun: async (_actorId, profileId) => run(state, profileId, false),
    requestWrite: async (_actorId, profileId) => requestWrite(deps, confirmations, profileId),
    writeIndex: async (_actorId, profileId) => writeIndex(state, profileId),
    confirmWrite: async (_actorId, token) => confirmWrite(state, confirmations, token),
    requestFullReindex: async (_actorId, profileId) => requestWrite(deps, confirmations, profileId),
    confirmFullReindex: async (_actorId, token) => confirmWrite(state, confirmations, token),
    listJobs: async (_actorId, limit) => okValue(jobs.slice(0, limit)),
    testQuery: async () => testQueryResult(),
    getProviderSettings: async () => readProviderSettings(deps),
    setChatProvider: async (actorId, provider) => updateChatProvider(deps, actorId, provider),
    setEmbeddingProvider: async (actorId, provider) =>
      updateEmbeddingProvider(deps, actorId, provider),
    setEmbeddingModel: async (actorId, model) => updateEmbeddingModel(deps, actorId, model),
  };
}

export function buildKnowledgeOperationsProvider(opts: {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  settings?: import('../bot-server.types.js').SettingsProvider;
}): KnowledgeOperationsProvider {
  return createKnowledgeOperationsProvider(liveKnowledgeDeps(opts));
}

async function writeIndex(
  state: RuntimeState,
  profileId: string,
): Promise<KnowledgeOperationResult<KnowledgeIngestionSummary>> {
  const estimate = await run({ deps: state.deps, jobs: [] }, profileId, false);
  if (!estimate.success) return estimate;
  const maxWriteChunks = state.deps.maxWriteChunks();
  if (estimate.value.chunks > maxWriteChunks) {
    state.deps.logger.warn({
      msg: 'knowledge_ingestion_too_large',
      profileId,
      chunks: estimate.value.chunks,
      maxWriteChunks,
    });
    return fail('knowledge.ingestion_too_large', 'too_large');
  }
  return run(state, profileId, true);
}

async function readiness(
  deps: KnowledgeProviderDeps,
): Promise<KnowledgeOperationResult<RagReadinessSnapshot>> {
  try {
    const visibleProfiles = await publicProfiles(deps);
    const providerSettings = await deps.providerSettings();
    return okValue({
      aiEnabled: deps.aiEnabled(),
      providerConfigured: await deps.providerConfigured(),
      chatProvider: providerSettings.chatProvider,
      chatProviderConfigured: providerSettings.chatProviderConfigured,
      embeddingProvider: providerSettings.embeddingProvider,
      embeddingModel: providerSettings.embeddingModel,
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
  if (dryRun.value.chunks > deps.maxWriteChunks())
    return fail('knowledge.ingestion_too_large', 'too_large');
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
  try {
    const selected = await findKnowledgeProfile(state.deps, profileId);
    if (!selected) return fail('knowledge.profile_not_allowed');
    const summary = await scanKnowledgeProfile(state.deps, selected, write);
    state.jobs.unshift(summary);
    return okValue(summary);
  } catch (error) {
    const reason = knowledgeIngestionFailureReason(error);
    state.deps.logger.warn({
      msg: 'knowledge_ingestion_failed',
      error: safeError(error),
      reason,
      mode: write ? 'write' : 'dry-run',
      profileId,
    });
    return fail('knowledge.ingestion_failed', reason);
  }
}

async function publicProfiles(deps: KnowledgeProviderDeps): Promise<KnowledgeSourceProfile[]> {
  const profiles: KnowledgeSourceProfile[] = [];
  for (const item of await allKnowledgeProfiles(deps)) {
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

function fail<T>(code: string, reason?: string): KnowledgeOperationResult<T> {
  return { success: false, error: { code, reason } };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
