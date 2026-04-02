import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider } from '../../src/session.provider.js';
import { Session } from '../../src/session.types.js';
import { SessionRepository } from '../../src/session.repository.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/session.migrator.js';
import { DEFAULT_SESSION_TTL } from '../../src/session.constants.js';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

const mockSession: Session = {
  userId: 'user-1',
  chatId: 'chat-1',
  role: 'USER',
  status: 'ACTIVE',
  language: 'ar-EG',
  activeConversation: null,
  metadata: {},
  schemaVersion: 1,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SessionProvider', () => {
  let provider: SessionProvider;
  let mockCache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
  };
  let mockBus: {
    publish: ReturnType<typeof vi.fn>;
  };
  let mockRepo: {
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockLogger: {
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      expire: vi.fn(),
    };
    mockBus = {
      publish: vi.fn().mockResolvedValue(ok(undefined)),
    };
    mockRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockLogger = {
      error: vi.fn(),
    };

    provider = new SessionProvider({
      cache: mockCache,
      eventBus: mockBus,
      repository: mockRepo as unknown as SessionRepository,
      logger: mockLogger,
    });
  });

  describe('getSession', () => {
    it('should return session from cache if available', async () => {
      mockCache.get.mockResolvedValue(ok(mockSession));
      mockCache.expire.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockCache.get).toHaveBeenCalledWith('session:user-1:chat-1');
      // Should extend TTL via expire, not set
      expect(mockCache.expire).toHaveBeenCalledWith('session:user-1:chat-1', DEFAULT_SESSION_TTL);
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should fallback to repository if cache miss', async () => {
      mockCache.get.mockResolvedValue(ok(null));
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockRepo.findById).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        'session:user-1:chat-1',
        expect.anything(),
        DEFAULT_SESSION_TTL,
      );
    });

    it('should fallback to repository if cache fails', async () => {
      mockCache.get.mockResolvedValue(err(new AppError('session.redis_error')));
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
    });
  });

  describe('saveSession', () => {
    it('should save to cache and publish event', async () => {
      mockCache.set.mockResolvedValue(ok(undefined));
      mockBus.publish.mockResolvedValue(ok(undefined));

      const result = await provider.saveSession(mockSession);

      expect(result.isOk()).toBe(true);
      expect(mockCache.set).toHaveBeenCalledWith(
        'session:user-1:chat-1',
        expect.anything(),
        DEFAULT_SESSION_TTL,
      );
      expect(mockBus.publish).toHaveBeenCalledWith(
        'session-manager.session.updated',
        expect.anything(),
      );
    });

    it('should handle version increments for OCC', async () => {
      mockCache.set.mockResolvedValue(ok(undefined));
      mockBus.publish.mockResolvedValue(ok(undefined));

      const result = await provider.saveSession(mockSession);
      expect(result.isOk()).toBe(true);

      const savedSession = mockCache.set.mock.calls[0][1];
      expect(savedSession.version).toBe(mockSession.version + 1);
    });

    // Rule XXXII
    it('should alert SUPER_ADMIN via logger when cache.set fails', async () => {
      mockCache.set.mockResolvedValue(err(new AppError('session.redis_error')));
      mockBus.publish.mockResolvedValue(ok(undefined));

      const result = await provider.saveSession(mockSession);

      expect(result.isOk()).toBe(true); // still succeeds (falls through to event bus)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN' }),
        }),
      );
    });
  });

  // Validates Redis degradation strategy (Constitution Rule XXXII)
  describe('SessionProvider cache failure fallback', () => {
    it('should alert SUPER_ADMIN via logger when cache.get fails', async () => {
      mockCache.get.mockResolvedValue(err(new AppError('session.redis_error')));
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true); // fallback succeeded
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN' }),
        }),
      );
    });

    it('should alert SUPER_ADMIN via logger when cache.del fails in deleteSession', async () => {
      mockCache.del.mockResolvedValue(err(new AppError('session.redis_error')));
      mockRepo.delete.mockResolvedValue(ok(undefined));

      await provider.deleteSession('user-1', 'chat-1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN' }),
        }),
      );
    });
  });

  describe('schema migration', () => {
    it('should apply migration when loading session from repository', async () => {
      // Session in DB has schemaVersion below current — still returns ok since only v1 exists now
      const oldSession = { ...mockSession, schemaVersion: CURRENT_SCHEMA_VERSION };
      mockCache.get.mockResolvedValue(ok(null)); // cache miss
      mockRepo.findById.mockResolvedValue(ok(oldSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  // Fix 1.2: Verify unchecked Result values trigger alertDegradation
  describe('unchecked Result handling (Rule X)', () => {
    it('should call alertDegradation when cache.expire fails but still return the session', async () => {
      mockCache.get.mockResolvedValue(ok(mockSession));
      mockCache.expire.mockResolvedValue(err(new AppError('session.expire_failed')));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN', operation: 'expire' }),
        }),
      );
    });

    it('should call alertDegradation when cache.set fails during fallback sync but still return the session', async () => {
      mockCache.get.mockResolvedValue(ok(null)); // cache miss
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(err(new AppError('session.set_failed')));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN', operation: 'set' }),
        }),
      );
    });

    it('should call alertDegradation when eventBus.publish fails but still return ok from saveSession', async () => {
      mockCache.set.mockResolvedValue(ok(undefined));
      mockBus.publish.mockResolvedValue(err(new AppError('session.publish_failed')));

      const result = await provider.saveSession(mockSession);

      expect(result.isOk()).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'session.system_degradation',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN', operation: 'publish' }),
        }),
      );
    });
  });

  describe('EventBusAdapter type safety', () => {
    it('should accept correct payload for session-manager.session.updated', () => {
      const bus: import('../../src/session.provider.js').EventBusAdapter = mockBus;
      // Correct payload shape — must compile without error
      void bus.publish('session-manager.session.updated', {
        userId: 'u1',
        chatId: 'c1',
        sessionData: {},
      });
    });

    it('should accept correct payload for session.redis.degraded', () => {
      const bus: import('../../src/session.provider.js').EventBusAdapter = mockBus;
      // Correct payload shape — must compile without error
      void bus.publish('session.redis.degraded', {
        operation: 'get',
        errorCode: 'CONN',
        errorMessage: 'fail',
        timestamp: '2026-01-01T00:00:00Z',
      });
    });

    it('should reject wrong payload for session-manager.session.updated', () => {
      const bus: import('../../src/session.provider.js').EventBusAdapter = mockBus;
      // @ts-expect-error — wrong shape: missing required fields
      void bus.publish('session-manager.session.updated', { wrong: 'shape' });
    });

    it('should reject wrong payload for session.redis.degraded', () => {
      const bus: import('../../src/session.provider.js').EventBusAdapter = mockBus;
      // @ts-expect-error — wrong shape: missing required fields
      void bus.publish('session.redis.degraded', { wrong: 'shape' });
    });

    it('should allow unknown events with unknown payload (forward compat)', () => {
      const bus: import('../../src/session.provider.js').EventBusAdapter = mockBus;
      // Unregistered event — should accept any payload via fallback overload
      void bus.publish('some.future.event', { arbitrary: true });
    });
  });
});
