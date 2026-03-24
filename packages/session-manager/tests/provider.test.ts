import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionProvider } from '../src/provider';
import { Session } from '../src/types';
import { SessionRepository } from '../src/repository';
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
    };
    mockBus = {
      publish: vi.fn(),
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

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockCache.get).toHaveBeenCalledWith('session:user-1:chat-1');
      // Should extend TTL
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should fallback to repository if cache miss', async () => {
      mockCache.get.mockResolvedValue(ok(null));
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockSession);
      expect(mockRepo.findById).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should fallback to repository if cache fails', async () => {
      mockCache.get.mockResolvedValue(err(new AppError('redis_error')));
      mockRepo.findById.mockResolvedValue(ok(mockSession));

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
      expect(mockCache.set).toHaveBeenCalled();
      expect(mockBus.publish).toHaveBeenCalledWith(
        'session-manager.session.updated',
        expect.anything(),
      );
    });

    it('should handle version increments for OCC', async () => {
      // In real impl, saveSession might increment version or expect it to be incremented
      // Let's assume it increments it
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.saveSession(mockSession);
      expect(result.isOk()).toBe(true);

      const savedSession = mockCache.set.mock.calls[0][1];
      expect(savedSession.version).toBe(mockSession.version + 1);
    });

    it('should alert SUPER_ADMIN via logger when cache.set fails (Rule XXXII)', async () => {
      mockCache.set.mockResolvedValue(err(new AppError('redis_error')));
      mockBus.publish.mockResolvedValue(ok(undefined));

      const result = await provider.saveSession(mockSession);

      expect(result.isOk()).toBe(true); // still succeeds (falls through to event bus)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SYSTEM_DEGRADATION',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN' }),
        }),
      );
    });
  });

  describe('Rule XXXII degradation (getSession)', () => {
    it('should alert SUPER_ADMIN via logger when cache.get fails', async () => {
      mockCache.get.mockResolvedValue(err(new AppError('redis_error')));
      mockRepo.findById.mockResolvedValue(ok(mockSession));
      mockCache.set.mockResolvedValue(ok(undefined));

      const result = await provider.getSession('user-1', 'chat-1');

      expect(result.isOk()).toBe(true); // fallback succeeded
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SYSTEM_DEGRADATION',
          payload: expect.objectContaining({ target: 'SUPER_ADMIN' }),
        }),
      );
    });
  });
});
