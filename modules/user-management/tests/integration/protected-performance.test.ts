import { performance } from 'node:perf_hooks';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import {
  BaseRepository,
  NodeProtectedDataService,
  prisma,
  type ProtectedDataKeyProvider,
  type ProtectedDataService,
} from '@tempot/database';
import { TestDB } from '@tempot/database/testing';
import type { UserProfile } from '../../types/index.js';
import { UserRepository } from '../../repositories/user.repository.js';

const TRIAL_COUNT = 7;
const SAMPLES_PER_TRIAL = 80;
const WARMUP_COUNT = 20;
const MAX_REGRESSION_RATIO = 1.2;

class LegacyUserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management-performance-baseline';
  protected entityName = 'userProfile';

  protected get model() {
    return this.db.userProfile;
  }
}

describe('UserRepository protected-data performance', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  const encryptionKey = Buffer.alloc(32, 31);
  const lookupKey = Buffer.alloc(32, 32);
  const keyProvider: ProtectedDataKeyProvider = {
    getActiveEncryptionKey: () => ok({ version: 'enc-perf-v1', key: encryptionKey }),
    getEncryptionKey: () => ok({ version: 'enc-perf-v1', key: encryptionKey }),
    getActiveLookupKey: () => ok({ version: 'lookup-perf-v1', key: lookupKey }),
    getLookupKey: () => ok({ version: 'lookup-perf-v1', key: lookupKey }),
    getReadableLookupKeyVersions: () => ok(['lookup-perf-v1']),
    validate: () => ok(undefined),
  };

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    await testDb.prisma.userProfile.createMany({
      data: [
        { id: 'perf-legacy', telegramId: 9_500_000_001n },
        { id: 'perf-protected', telegramId: 9_500_000_002n },
      ],
    });
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('keeps protected update p95 regression within 20 percent', async () => {
    const database = testDb.prisma as unknown as typeof prisma;
    const legacyRepository = new LegacyUserRepository(auditLogger, database);
    const protectedData = new NodeProtectedDataService(keyProvider);
    const protectedRepository = new UserRepository(auditLogger, database, protectedData);

    for (let index = 0; index < WARMUP_COUNT; index += 1) {
      await legacyRepository.update(
        'perf-legacy',
        buildEquivalentWrite(protectedData, `legacy-warmup-${index}@example.invalid`),
      );
      await protectedRepository.updateEmail(
        'perf-protected',
        `protected-warmup-${index}@example.invalid`,
      );
    }

    const trials: TrialResult[] = [];
    for (let trial = 0; trial < TRIAL_COUNT; trial += 1) {
      trials.push(
        await runTrial({
          trial,
          legacyRepository,
          protectedRepository,
          protectedData,
        }),
      );
    }

    /*
     * Each trial alternates execution order to cancel drift. The control writes
     * the same protected columns through BaseRepository with crypto precomputed,
     * so the measured delta is protection/recovery overhead rather than a wider
     * PostgreSQL write. Geometric mean is used because the benchmark compares
     * normalized ratios; it rejects persistent multiplicative regressions while
     * cancelling runner noise that swings both the protected and legacy samples.
     */
    const summaryRatio = geometricMean(trials.map(({ ratio }) => ratio));
    if (process.env['REPORT_PROTECTED_DATA_PERFORMANCE'] === 'true') {
      process.stdout.write(
        `${JSON.stringify({
          trials,
          geometricMeanRegressionPercent: (summaryRatio - 1) * 100,
          samplesPerTrial: SAMPLES_PER_TRIAL,
        })}\n`,
      );
    }
    expect(
      summaryRatio,
      `protected p95 geometric mean regression ${formatPercent(
        summaryRatio,
      )} exceeded 20%; trials: ${trials.map(formatTrial).join(', ')}`,
    ).toBeLessThanOrEqual(MAX_REGRESSION_RATIO);
  }, 120_000);
});
type TrialParams = {
  trial: number;
  legacyRepository: LegacyUserRepository;
  protectedRepository: UserRepository;
  protectedData: ProtectedDataService;
};
type TrialResult = {
  legacyP95Ms: number;
  protectedP95Ms: number;
  ratio: number;
};
async function runTrial(params: TrialParams): Promise<TrialResult> {
  const legacySamples: number[] = [];
  const protectedSamples: number[] = [];
  for (let sample = 0; sample < SAMPLES_PER_TRIAL; sample += 1) {
    const suffix = `${params.trial}-${sample}`;
    const legacyWrite = buildEquivalentWrite(
      params.protectedData,
      `legacy-${suffix}@example.invalid`,
    );
    const protectedOperation = () =>
      params.protectedRepository.updateEmail(
        'perf-protected',
        `protected-${suffix}@example.invalid`,
      );
    const legacyOperation = () => params.legacyRepository.update('perf-legacy', legacyWrite);
    if ((params.trial + sample) % 2 === 0) {
      protectedSamples.push(await measure(protectedOperation));
      legacySamples.push(await measure(legacyOperation));
    } else {
      legacySamples.push(await measure(legacyOperation));
      protectedSamples.push(await measure(protectedOperation));
    }
  }
  const legacyP95Ms = percentile(legacySamples, 0.95);
  const protectedP95Ms = percentile(protectedSamples, 0.95);
  return { legacyP95Ms, protectedP95Ms, ratio: protectedP95Ms / legacyP95Ms };
}
function buildEquivalentWrite(
  service: ProtectedDataService,
  email: string,
): Record<string, unknown> {
  const protectedValue = service.protect(email, {
    fieldId: 'email',
    recordId: 'perf-legacy',
  });
  if (protectedValue.isErr()) throw protectedValue.error;
  const lookup = service.createLookupToken(email, 'email');
  if (lookup.isErr()) throw lookup.error;
  return {
    email: null,
    emailProtected: protectedValue.value,
    emailLookupToken: lookup.value.token,
    emailLookupKeyVersion: lookup.value.tokenKeyVersion,
    emailNormalizationVersion: lookup.value.normalizationVersion,
  };
}

async function measure(operation: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  if (
    result !== null &&
    typeof result === 'object' &&
    'isErr' in result &&
    typeof result.isErr === 'function' &&
    result.isErr()
  ) {
    throw new Error('Performance sample operation failed');
  }
  return duration;
}

function percentile(samples: readonly number[], percentileRank: number): number {
  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.ceil(sorted.length * percentileRank) - 1;
  const value = sorted[index];
  if (value === undefined) throw new Error('Performance samples are empty');
  return value;
}

function geometricMean(samples: readonly number[]): number {
  if (samples.length === 0) throw new Error('Performance samples are empty');
  return Math.exp(samples.reduce((total, value) => total + Math.log(value), 0) / samples.length);
}

function formatPercent(ratio: number): string {
  return `${((ratio - 1) * 100).toFixed(2)}%`;
}

function formatTrial(trial: TrialResult): string {
  return `${formatPercent(trial.ratio)} legacy=${trial.legacyP95Ms.toFixed(
    2,
  )}ms protected=${trial.protectedP95Ms.toFixed(2)}ms`;
}
