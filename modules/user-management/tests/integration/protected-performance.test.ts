import { performance } from 'node:perf_hooks';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import {
  BaseRepository,
  NodeProtectedDataService,
  prisma,
  type ProtectedDataKeyProvider,
} from '@tempot/database';
import { TestDB } from '@tempot/database/testing';
import type { UserProfile } from '../../types/index.js';
import { UserRepository } from '../../repositories/user.repository.js';

const SAMPLE_COUNT = 60;
const WARMUP_COUNT = 10;
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
    const protectedRepository = new UserRepository(
      auditLogger,
      database,
      new NodeProtectedDataService(keyProvider),
    );

    for (let index = 0; index < WARMUP_COUNT; index += 1) {
      await legacyRepository.update('perf-legacy', {
        email: `legacy-warmup-${index}@example.invalid`,
      });
      await protectedRepository.updateEmail(
        'perf-protected',
        `protected-warmup-${index}@example.invalid`,
      );
    }

    const legacySamples: number[] = [];
    const protectedSamples: number[] = [];
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const protectedFirst = index % 2 === 0;
      if (protectedFirst) {
        protectedSamples.push(
          await measure(() =>
            protectedRepository.updateEmail('perf-protected', `protected-${index}@example.invalid`),
          ),
        );
        legacySamples.push(
          await measure(() =>
            legacyRepository.update('perf-legacy', {
              email: `legacy-${index}@example.invalid`,
            }),
          ),
        );
      } else {
        legacySamples.push(
          await measure(() =>
            legacyRepository.update('perf-legacy', {
              email: `legacy-${index}@example.invalid`,
            }),
          ),
        );
        protectedSamples.push(
          await measure(() =>
            protectedRepository.updateEmail('perf-protected', `protected-${index}@example.invalid`),
          ),
        );
      }
    }

    const legacyP95 = percentile(legacySamples, 0.95);
    const protectedP95 = percentile(protectedSamples, 0.95);
    if (process.env['REPORT_PROTECTED_DATA_PERFORMANCE'] === 'true') {
      process.stdout.write(
        `${JSON.stringify({
          legacyP95Ms: legacyP95,
          protectedP95Ms: protectedP95,
          regressionPercent: (protectedP95 / legacyP95 - 1) * 100,
          sampleCount: SAMPLE_COUNT,
        })}\n`,
      );
    }
    expect(
      protectedP95,
      `protected p95 ${protectedP95.toFixed(3)}ms exceeded baseline ${legacyP95.toFixed(3)}ms`,
    ).toBeLessThanOrEqual(legacyP95 * MAX_REGRESSION_RATIO);
  }, 120_000);
});

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
