import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { RateLimitConfig } from '../../src/ai-core.types.js';

/**
 * Mock rate-limiter-flexible module.
 * RateLimiterRedis.consume() throws when limit is exceeded (real behavior).
 * We track calls per userId to simulate exhaustion.
 */
const mockConsume = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock('rate-limiter-flexible', () => {
  class MockRateLimiterRedis {
    consume = mockConsume;
    get = mockGet;
    delete = mockDelete;
  }
  return {
    RateLimiterRedis: MockRateLimiterRedis,
  };
});

// Import after mock setup
import { RateLimiterService } from '../../src/rate-limiter/rate-limiter.service.js';

const testConfig: RateLimitConfig = {
  userLimit: 20,
  adminLimit: 50,
  superAdminLimit: 0, // 0 = unlimited
  windowMs: 86_400_000, // 24 hours
};

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  const fakeRedisClient = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsume.mockResolvedValue({ remainingPoints: 19, consumedPoints: 1 });
    mockGet.mockResolvedValue(null);
    mockDelete.mockResolvedValue(undefined);
    service = new RateLimiterService(fakeRedisClient, testConfig);
  });

  describe('consume', () => {
    it('returns ok when under limit', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 19, consumedPoints: 1 });

      const result = await service.consume('user-1', 'user');

      expect(result.isOk()).toBe(true);
      expect(mockConsume).toHaveBeenCalledWith('user-1', 1, { customDuration: undefined });
    });

    it('returns err(RATE_LIMITED) when limit exceeded', async () => {
      // RateLimiterRedis throws when limit exceeded
      mockConsume.mockRejectedValue({ remainingPoints: 0, consumedPoints: 20 });

      const result = await service.consume('user-1', 'user');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RATE_LIMITED);
    });

    it('super admin (limit=0) always returns ok (unlimited)', async () => {
      // consume should NOT be called for super_admin
      const result = await service.consume('admin-1', 'super_admin');

      expect(result.isOk()).toBe(true);
      expect(mockConsume).not.toHaveBeenCalled();
    });

    it('admin limit applied correctly', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 49, consumedPoints: 1 });

      const result = await service.consume('admin-1', 'admin');

      expect(result.isOk()).toBe(true);
      expect(mockConsume).toHaveBeenCalledWith('admin-1', 1, { customDuration: undefined });
    });
  });

  describe('getRemaining', () => {
    it('returns correct remaining count', async () => {
      mockGet.mockResolvedValue({ consumedPoints: 5 });

      const result = await service.getRemaining('user-1', 'user');

      expect(result.isOk()).toBe(true);
      // userLimit=20, consumed=5, remaining=15
      expect(result._unsafeUnwrap()).toBe(15);
    });

    it('returns full limit when no consumption', async () => {
      mockGet.mockResolvedValue(null);

      const result = await service.getRemaining('user-1', 'user');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(20);
    });

    it('returns Infinity for super admin', async () => {
      const result = await service.getRemaining('admin-1', 'super_admin');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(Infinity);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('clears user rate limit', async () => {
      mockDelete.mockResolvedValue(undefined);

      const result = await service.reset('user-1');

      expect(result.isOk()).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith('user-1');
    });
  });

  describe('role-based limit selection', () => {
    it('selects correct limit for each role', async () => {
      // We test by checking getRemaining returns the correct full limit
      // when no consumption exists (mockGet returns null)

      const userResult = await service.getRemaining('u1', 'user');
      expect(userResult._unsafeUnwrap()).toBe(20); // userLimit

      const adminResult = await service.getRemaining('a1', 'admin');
      expect(adminResult._unsafeUnwrap()).toBe(50); // adminLimit

      const superResult = await service.getRemaining('s1', 'super_admin');
      expect(superResult._unsafeUnwrap()).toBe(Infinity); // superAdminLimit=0 => Infinity
    });
  });

  describe('error handling', () => {
    it('getRemaining returns err when Redis fails', async () => {
      mockGet.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.getRemaining('user-1', 'user');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RATE_LIMITED);
    });

    it('reset returns err when Redis fails', async () => {
      mockDelete.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.reset('user-1');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RATE_LIMITED);
    });

    it('consume returns err with context details when rate limited', async () => {
      mockConsume.mockRejectedValue({ remainingPoints: 0 });

      const result = await service.consume('user-1', 'user');

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(AI_ERRORS.RATE_LIMITED);
      expect(error.details).toEqual({
        userId: 'user-1',
        role: 'user',
        limit: 20,
        windowMs: 86_400_000,
        cause: { remainingPoints: 0 },
      });
    });
  });
});
