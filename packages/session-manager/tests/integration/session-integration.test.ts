/**
 * Integration tests for SessionProvider backed by a real Redis testcontainer.
 *
 * SC-001 (<2ms cache retrieval latency) is NOT verified here because testcontainer
 * networking introduces unavoidable overhead. The SC-001 latency target is verified
 * in load testing against a production-like Redis deployment.
 *
 * Test strategy:
 * - Real Redis (via testcontainer) for the cache layer
 * - Mocked repository (vi.fn()) — we test the cache integration boundary only
 * - Mocked eventBus (vi.fn()) — event publishing is covered by unit tests
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { Session } from '../../src/types.js';
import { SessionProvider } from '../../src/provider.js';
import { SessionRepository } from '../../src/repository.js';
import { TestRedis } from '../utils/test-redis.js';
import { DEFAULT_SESSION_TTL } from '../../src/constants.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides?: Partial<Session>): Session {
  return {
    userId: 'user-1',
    chatId: 'chat-1',
    role: 'USER',
    status: 'ACTIVE',
    language: 'ar-EG',
    activeConversation: null,
    metadata: null,
    schemaVersion: 1,
    version: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SessionProvider integration (Redis testcontainer)', () => {
  const testRedis = new TestRedis();
  let provider: SessionProvider;
  let mockRepo: {
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockBus: { publish: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    await testRedis.start();
  }, 60_000);

  afterAll(async () => {
    await testRedis.stop();
  }, 30_000);

  beforeEach(() => {
    // Fresh mocks per test — real cache is shared but each test uses distinct keys
    mockRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockBus = {
      publish: vi.fn().mockResolvedValue(ok(undefined)),
    };

    provider = new SessionProvider({
      cache: testRedis.createCacheAdapter(),
      eventBus: mockBus,
      repository: mockRepo as unknown as SessionRepository,
    });
  });

  // -------------------------------------------------------------------------
  // Test 1: Cache hit — retrieve session that was previously stored in Redis
  // -------------------------------------------------------------------------
  it('should retrieve session from Redis cache (cache hit)', async () => {
    const session = makeSession({ userId: 'u-hit', chatId: 'c-hit' });

    // Pre-populate cache by saving via provider
    mockRepo.findById.mockResolvedValue(ok(session));
    mockBus.publish.mockResolvedValue(ok(undefined));

    await provider.saveSession(session);

    // Now retrieve — repository must NOT be called
    mockRepo.findById.mockClear();

    const result = await provider.getSession('u-hit', 'c-hit');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().userId).toBe('u-hit');
    expect(result._unsafeUnwrap().chatId).toBe('c-hit');
    // Repository was NOT consulted on a cache hit
    expect(mockRepo.findById).not.toHaveBeenCalled();
  }, 30_000);

  // -------------------------------------------------------------------------
  // Test 2: Cache miss — provider falls back to repository
  // -------------------------------------------------------------------------
  it('should fall back to repository when cache misses', async () => {
    const session = makeSession({ userId: 'u-miss', chatId: 'c-miss' });

    // Key deliberately NOT seeded in cache
    mockRepo.findById.mockResolvedValue(ok(session));

    const result = await provider.getSession('u-miss', 'c-miss');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().userId).toBe('u-miss');
    // Repository must have been called exactly once for the fallback
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith('u-miss:c-miss');
  }, 30_000);

  // -------------------------------------------------------------------------
  // Test 3: Sliding TTL — cache.expire is called on every cache hit to extend TTL
  // -------------------------------------------------------------------------
  it('should extend TTL on cache hit (sliding TTL)', async () => {
    const session = makeSession({ userId: 'u-ttl', chatId: 'c-ttl' });

    // Seed the cache via save
    await provider.saveSession(session);

    // Spy on the real adapter's expire by wrapping the adapter
    const adapter = testRedis.createCacheAdapter();
    const expireSpy = vi.spyOn(adapter, 'expire');

    const spiedProvider = new SessionProvider({
      cache: adapter,
      eventBus: mockBus,
      repository: mockRepo as unknown as SessionRepository,
    });

    // Get — should extend TTL (calls expire internally)
    const result = await spiedProvider.getSession('u-ttl', 'c-ttl');

    expect(result.isOk()).toBe(true);
    // expire was called once with the DEFAULT_SESSION_TTL (86400) to extend expiration
    expect(expireSpy).toHaveBeenCalledOnce();
    const [calledKey, calledTtl] = expireSpy.mock.calls[0];
    expect(calledKey).toBe('session:u-ttl:c-ttl');
    expect(calledTtl).toBe(DEFAULT_SESSION_TTL);
  }, 30_000);

  // -------------------------------------------------------------------------
  // Test 4: Composite key format — key must be session:userId:chatId
  // -------------------------------------------------------------------------
  it('should use composite userId+chatId key', async () => {
    const session = makeSession({ userId: 'user-1', chatId: 'chat-1' });

    const adapter = testRedis.createCacheAdapter();
    const getSpy = vi.spyOn(adapter, 'get');

    const spiedProvider = new SessionProvider({
      cache: adapter,
      eventBus: mockBus,
      repository: mockRepo as unknown as SessionRepository,
    });

    mockRepo.findById.mockResolvedValue(ok(session));

    await spiedProvider.getSession('user-1', 'chat-1');

    // Verify the exact key format used by the provider
    expect(getSpy).toHaveBeenCalledWith('session:user-1:chat-1');
  }, 30_000);

  // -------------------------------------------------------------------------
  // Test 5: Both layers fail — provider returns err
  // -------------------------------------------------------------------------
  it('should return err when both cache and repository fail', async () => {
    // Cache miss + repository error
    mockRepo.findById.mockResolvedValue(err(new AppError('not_found')));

    const result = await provider.getSession('u-fail', 'c-fail');

    expect(result.isErr()).toBe(true);
    // Repository was consulted as fallback
    expect(mockRepo.findById).toHaveBeenCalledWith('u-fail:c-fail');
  }, 30_000);

  // -------------------------------------------------------------------------
  // Test 6: OCC version increment — saveSession bumps version by 1
  // -------------------------------------------------------------------------
  it('should increment version on save (OCC)', async () => {
    const session = makeSession({ userId: 'u-occ', chatId: 'c-occ', version: 1 });

    await provider.saveSession(session);

    // Retrieve from cache to inspect the stored version
    const result = await provider.getSession('u-occ', 'c-occ');

    // Repository must NOT be needed — session is now cached
    expect(mockRepo.findById).not.toHaveBeenCalled();

    expect(result.isOk()).toBe(true);
    const stored = result._unsafeUnwrap();
    // version should have been incremented from 1 → 2 by saveSession
    expect(stored.version).toBe(2);
  }, 30_000);
});
